import express from 'express';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Octokit } from '@octokit/rest';
import { deserializeSession, Session } from './sessionManager.js';
import { detectGitHubRepo } from './gitRepo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createDashboardServer() {
    const app = express();
    
    // Parse JSON bodies
    app.use(express.json());
    
    // Serve static files
    const publicPath = join(__dirname, '../../public');
    app.use(express.static(publicPath));
    
    // API endpoints
    app.get('/api/sessions', async (req, res) => {
        try {
            const sessionsDir = join(process.cwd(), '.trak/sessions');
            const files = await readdir(sessionsDir);
            const sessionFiles = files.filter(f => f.endsWith('.json'));
            
            const sessions = await Promise.all(
                sessionFiles.map(async (file) => {
                    const content = await readFile(join(sessionsDir, file), 'utf8');
                    const session: Session = deserializeSession(JSON.parse(content));
                    return {
                        id: session.id,
                        startTime: session.startTime.toISOString(),
                        endTime: session.endTime?.toISOString(),
                        status: session.status,
                        summary: session.summary || '',
                        qualityScore: session.analysis?.metrics?.qualityScore || 0,
                        issueCount: session.analysis?.metrics?.issueCount || { high: 0, medium: 0, low: 0 }
                    };
                })
            );
            
            // Sort by start time (newest first)
            sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
            
            res.json(sessions);
        } catch (error: any) {
            if (error?.code === 'ENOENT') {
                res.json([]);
                return;
            }
            res.status(500).json({ error: 'Failed to load sessions' });
        }
    });
    
    app.get('/api/sessions/:id', async (req, res) => {
        try {
            const sessionsDir = join(process.cwd(), '.trak/sessions');
            const files = await readdir(sessionsDir);
            
            for (const file of files) {
                const content = await readFile(join(sessionsDir, file), 'utf8');
                const session: Session = deserializeSession(JSON.parse(content));
                
                if (session.id === req.params.id) {
                    // Convert dates to strings for JSON response
                    const responseSession = {
                        ...session,
                        startTime: session.startTime.toISOString(),
                        endTime: session.endTime?.toISOString(),
                    };
                    res.json(responseSession);
                    return;
                }
            }
            
            res.status(404).json({ error: 'Session not found' });
        } catch (error: any) {
            if (error?.code === 'ENOENT') {
                res.status(404).json({ error: 'Session not found' });
                return;
            }
            res.status(500).json({ error: 'Failed to load session' });
        }
    });
    
    app.get('/api/current', async (req, res) => {
        try {
            const currentPath = join(process.cwd(), '.trak/current-session.json');
            const content = await readFile(currentPath, 'utf8');
            const session: Session = deserializeSession(JSON.parse(content));
            // Convert dates to strings for JSON response
            const responseSession = {
                ...session,
                startTime: session.startTime.toISOString(),
                endTime: session.endTime?.toISOString(),
            };
            res.json(responseSession);
        } catch (error) {
            res.json(null);
        }
    });
    
    // Create GitHub issue endpoint
    app.post('/api/issues/create', async (req, res) => {
        try {
            const { issueData, sessionId, repoUrl } = req.body;
            
            if (!issueData || !sessionId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Missing required fields: issueData, sessionId' 
                });
            }
            
            const githubToken = process.env.GITHUB_TOKEN;
            if (!githubToken) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'GitHub token not configured. Please set GITHUB_TOKEN environment variable.' 
                });
            }
            
            // Auto-detect repo or use provided URL
            let finalRepoUrl = repoUrl;
            if (!finalRepoUrl) {
                try {
                    finalRepoUrl = detectGitRepository();
                } catch (error) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Could not detect Git repository. Please ensure you are in a Git repository with a GitHub remote.' 
                    });
                }
            }
            
            // Parse repo URL (owner/repo format)
            const repoMatch = finalRepoUrl.match(/^([^\/]+)\/([^\/]+)$/);
            if (!repoMatch) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid repo format. Use "owner/repo" format (e.g., "microsoft/vscode")' 
                });
            }
            
            const [, owner, repo] = repoMatch;
            
            const octokit = new Octokit({ auth: githubToken });
            
            // Format issue title and body
            const title = `[trak] ${issueData.type}: ${issueData.description.split('.')[0]}`;
            const body = formatIssueBody(issueData, sessionId);
            const labels = getIssueLabels(issueData);
            
            // Create GitHub issue
            const response = await octokit.rest.issues.create({
                owner,
                repo,
                title,
                body,
                labels
            });
            
            res.json({
                success: true,
                issueUrl: response.data.html_url,
                issueNumber: response.data.number
            });
            
        } catch (error: any) {
            console.error('GitHub issue creation failed:', error);
            
            let errorMessage = 'Failed to create GitHub issue';
            if (error.status === 401) {
                errorMessage = 'Invalid GitHub token. Please check your GITHUB_TOKEN.';
            } else if (error.status === 404) {
                errorMessage = 'Repository not found. Please check the repo URL and permissions.';
            } else if (error.status === 403) {
                errorMessage = 'Permission denied. Please check your GitHub token has repo access.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            res.status(500).json({ 
                success: false, 
                error: errorMessage 
            });
        }
    });
    
    // Get repository info endpoint
    app.get('/api/repo-info', async (req, res) => {
        try {
            const repoUrl = detectGitRepository();
            res.json({ 
                success: true, 
                repoUrl,
                detected: true 
            });
        } catch (error) {
            res.json({ 
                success: false, 
                detected: false,
                error: 'No Git repository detected' 
            });
        }
    });
    
    // Find available port
    let port = 3000;
    const server = await new Promise<any>((resolve, reject) => {
        const tryPort = (p: number) => {
            const s = app.listen(p, () => {
                resolve({ server: s, port: p });
            }).on('error', (err: any) => {
                if (err.code === 'EADDRINUSE') {
                    tryPort(p + 1);
                } else {
                    reject(err);
                }
            });
        };
        tryPort(port);
    });
    
    return server;
}

function formatIssueBody(issueData: any, sessionId: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    
    return `## 🤖 Issue Detected by Trak

**Severity:** ${issueData.severity}
**Type:** ${issueData.type}
**File:** \`${issueData.filePath}\`
**Line:** ${issueData.lineNumber}

### Description
${issueData.description}

### Suggested Fix
${issueData.suggestion}

---
*Detected during trak session on ${timestamp}*
*Session ID: ${sessionId}*`;
}

function getIssueLabels(issueData: any): string[] {
    const labels: string[] = [];
    
    // Add type-based labels
    const typeLabels: Record<string, string> = {
        'security': 'security',
        'performance': 'performance',
        'complexity': 'refactor',
        'error-handling': 'bug',
        'duplication': 'refactor',
        'documentation': 'documentation'
    };
    
    if (typeLabels[issueData.type]) {
        labels.push(typeLabels[issueData.type]);
    }
    
    // Add severity labels
    const severityLabels: Record<string, string> = {
        'high': 'high-priority',
        'medium': 'medium-priority',
        'low': 'low-priority'
    };
    
    if (severityLabels[issueData.severity]) {
        labels.push(severityLabels[issueData.severity]);
    }
    
    // Add trak label
    labels.push('trak');
    
    return labels;
}

function detectGitRepository(): string {
    const info = detectGitHubRepo(process.cwd());
    if (!info) throw new Error('Could not detect Git repository');
    return info.fullName;
}
