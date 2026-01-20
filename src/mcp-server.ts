#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createSessionManager, deserializeSession } from './services/sessionManager.js';
import { createSummaryGenerator } from './services/summaryGenerator.js';
import { readdir, readFile, writeFile, mkdir, unlink, chmod } from 'fs/promises';
import { join } from 'path';
import { Octokit } from '@octokit/rest';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let activeCwd: string | undefined;

const server = new Server(
  {
    name: 'trak-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'trak_start_session',
        description: 'Start tracking a coding session',
        inputSchema: {
          type: 'object',
          properties: {
            cwd: {
              type: 'string',
              description: 'Working directory to track (optional, defaults to current directory)',
            },
          },
        },
      },
      {
        name: 'trak_stop_session',
        description: 'Stop tracking session and generate AI analysis',
        inputSchema: {
          type: 'object',
          properties: {
            cwd: {
              type: 'string',
              description: 'Working directory to stop the active session in (optional; defaults to the last started cwd or current directory)',
            },
          },
        },
      },
      {
        name: 'trak_get_status',
        description: 'Get current session status',
        inputSchema: {
          type: 'object',
          properties: {
            cwd: {
              type: 'string',
              description: 'Working directory to read session status from (optional; defaults to the last started cwd or current directory)',
            },
          },
        },
      },
      {
        name: 'trak_get_session_history',
        description: 'Query past sessions with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            cwd: {
              type: 'string',
              description: 'Working directory to read session history from (optional; defaults to the last started cwd or current directory)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of sessions to return (default: 10)',
            },
            dateFrom: {
              type: 'string',
              description: 'Start date filter (ISO string)',
            },
            dateTo: {
              type: 'string',
              description: 'End date filter (ISO string)',
            },
          },
        },
      },
      {
        name: 'trak_analyze_session',
        description: 'Get detailed analysis of a specific session',
        inputSchema: {
          type: 'object',
          properties: {
            cwd: {
              type: 'string',
              description: 'Working directory to read session history from (optional; defaults to the last started cwd or current directory)',
            },
            sessionId: {
              type: 'string',
              description: 'Session ID to analyze',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'trak_create_github_issue',
        description: 'Create a GitHub issue from a detected code problem',
        inputSchema: {
          type: 'object',
          properties: {
            cwd: {
              type: 'string',
              description: 'Working directory to auto-detect repo from (optional; defaults to the last started cwd or current directory)',
            },
            issueData: {
              type: 'object',
              description: 'The detected issue data',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                severity: { type: 'string' },
                filePath: { type: 'string' },
                lineNumber: { type: 'number' },
                description: { type: 'string' },
                suggestion: { type: 'string' },
              },
              required: ['type', 'severity', 'filePath', 'lineNumber', 'description', 'suggestion'],
            },
            sessionId: {
              type: 'string',
              description: 'Session ID where the issue was detected',
            },
            repoUrl: {
              type: 'string',
              description: 'GitHub repository (owner/repo format, optional - will auto-detect if not provided)',
            },
          },
          required: ['issueData', 'sessionId'],
        },
      },
      {
        name: 'trak_login',
        description: 'Login to organization dashboard as a specific developer',
        inputSchema: {
          type: 'object',
          properties: {
            orgToken: {
              type: 'string',
              description: 'Organization token (e.g., demo-token-123)',
            },
            developerName: {
              type: 'string',
              description: 'Developer name (e.g., John Doe)',
            },
            developerId: {
              type: 'string',
              description: 'Developer ID/email (e.g., john@company.com)',
            },
          },
          required: ['orgToken', 'developerName', 'developerId'],
        },
      },
      {
        name: 'trak_logout',
        description: 'Logout from organization dashboard',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Tool implementations
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'trak_start_session':
        return await handleStartSession(args?.cwd as string | undefined);

      case 'trak_stop_session':
        return await handleStopSession(args?.cwd as string | undefined);

      case 'trak_get_status':
        return await handleGetStatus(args?.cwd as string | undefined);

      case 'trak_get_session_history':
        return await handleGetSessionHistory(
          args?.cwd as string | undefined,
          args?.limit as number | undefined, 
          args?.dateFrom as string | undefined, 
          args?.dateTo as string | undefined
        );

      case 'trak_analyze_session':
        if (!args?.sessionId) {
          throw new Error('sessionId is required');
        }
        return await handleAnalyzeSession(args.sessionId as string, args?.cwd as string | undefined);

      case 'trak_create_github_issue':
        if (!args?.issueData || !args?.sessionId) {
          throw new Error('issueData and sessionId are required');
        }
        return await handleCreateGitHubIssue(
          args.issueData as any,
          args.sessionId as string,
          args.repoUrl as string | undefined,
          args?.cwd as string | undefined
        );

      case 'trak_login':
        if (!args?.orgToken || !args?.developerName || !args?.developerId) {
          throw new Error('orgToken, developerName, and developerId are required');
        }
        return await handleLogin(
          args.orgToken as string,
          args.developerName as string,
          args.developerId as string
        );

      case 'trak_logout':
        return await handleLogout();

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    };
  }
});

async function handleStartSession(cwd?: string) {
  const effectiveCwd = cwd || process.cwd();
  const sessionManager = createSessionManager(effectiveCwd);
  
  try {
    // Prevent multiple active sessions in the same cwd
    if (sessionManager.isSessionActive()) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Session already active in this directory. Stop it first.',
              cwd: effectiveCwd,
            }, null, 2),
          },
        ],
      };
    }

    const session = sessionManager.startSession();

    // Spawn detached daemon process (same behavior as CLI `trak start`)
    const daemonScript = join(__dirname, 'services/daemon.js');
    const daemon = spawn('node', [daemonScript], {
      detached: true,
      stdio: 'ignore',
      cwd: effectiveCwd,
    });
    sessionManager.setDaemonPid(daemon.pid!);
    daemon.unref();

    activeCwd = effectiveCwd;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            sessionId: session.id,
            message: `Session started. Tracking changes in ${session.cwd}`,
            startTime: session.startTime instanceof Date 
              ? session.startTime.toISOString() 
              : session.startTime,
            cwd: session.cwd,
            daemonPid: daemon.pid,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to start session',
          }, null, 2),
        },
      ],
    };
  }
}

function resolveCwd(cwd?: string): string {
  return cwd || activeCwd || process.cwd();
}

async function handleStopSession(cwd?: string) {
  const effectiveCwd = resolveCwd(cwd);
  const sessionManager = createSessionManager(effectiveCwd);
  
  try {
    const session = sessionManager.getSession();
    if (!session) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'No active session found',
              cwd: effectiveCwd,
              hint: 'Start a session first, or pass { "cwd": "/path/to/repo" }.',
            }, null, 2),
          },
        ],
      };
    }

    // Kill the daemon process (if any)
    const daemonPid = session.daemonPid;
    if (daemonPid) {
      try {
        process.kill(daemonPid, 'SIGTERM');
      } catch {
        // ignore
      }
    }

    const summaryGenerator = createSummaryGenerator();

    // Read file contents for analysis (same approach as CLI stop)
    const fileContents = new Map<string, string>();
    for (const change of session.changes) {
      if (change.type !== 'deleted') {
        const fullPath = join(session.cwd, change.path);
        try {
          const content = await readFile(fullPath, 'utf8');
          fileContents.set(change.path, content);
        } catch {
          // Ignore read errors (file may not exist or may not be readable)
        }
      }
    }
    
    // Generate summary and analysis together
    const result = await summaryGenerator.generateSummary(session, fileContents);
    
    // Stop and persist session with analysis
    const finalSession = sessionManager.stopSession({
      summary: result.summary,
      analysis: result.analysis,
    });
    if (!finalSession) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Failed to stop session',
            }, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            sessionId: finalSession.id,
            summary: result.summary,
            qualityScore: result.analysis.metrics.qualityScore,
            issuesFound: result.analysis.issues.length,
            duration: calculateDuration(
              finalSession.startTime instanceof Date 
                ? finalSession.startTime.toISOString() 
                : finalSession.startTime,
              finalSession.endTime instanceof Date 
                ? finalSession.endTime.toISOString() 
                : finalSession.endTime || new Date().toISOString()
            ),
            analysis: result.analysis,
            cwd: effectiveCwd,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to stop session',
          }, null, 2),
        },
      ],
    };
  }
}

async function handleGetStatus(cwd?: string) {
  const effectiveCwd = resolveCwd(cwd);
  const sessionManager = createSessionManager(effectiveCwd);
  
  try {
    const session = sessionManager.getSession();
    
    if (!session) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              active: false,
              message: 'No active session',
              cwd: effectiveCwd,
            }, null, 2),
          },
        ],
      };
    }

    // Handle both Date objects and strings
    const startTimeStr = session.startTime instanceof Date 
      ? session.startTime.toISOString() 
      : session.startTime;
    
    const duration = calculateDuration(startTimeStr, new Date().toISOString());
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            active: true,
            sessionId: session.id,
            duration,
            filesChanged: session.changes.length,
            startTime: startTimeStr,
            cwd: session.cwd,
            daemonPid: session.daemonPid,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            active: false,
            error: error instanceof Error ? error.message : 'Failed to get status',
          }, null, 2),
        },
      ],
    };
  }
}

async function handleGetSessionHistory(cwd?: string, limit = 10, dateFrom?: string, dateTo?: string) {
  try {
    const effectiveCwd = resolveCwd(cwd);
    const sessionsDir = join(effectiveCwd, '.trak/sessions');
    const files = await readdir(sessionsDir);
    const sessionFiles = files.filter(f => f.endsWith('.json'));
    
    let sessions = await Promise.all(
      sessionFiles.map(async (file) => {
        const content = await readFile(join(sessionsDir, file), 'utf8');
        return deserializeSession(JSON.parse(content));
      })
    );

    // Apply date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      sessions = sessions.filter(s => s.startTime >= fromDate);
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      sessions = sessions.filter(s => s.startTime <= toDate);
    }

    // Sort by start time (newest first) and limit
    sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    sessions = sessions.slice(0, limit);

    // Format response
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      timestamp: session.startTime.toISOString(),
      duration: session.endTime ? calculateDuration(session.startTime.toISOString(), session.endTime.toISOString()) : 'Active',
      qualityScore: session.analysis?.metrics?.qualityScore || 0,
      issuesFound: session.analysis?.issues?.length || 0,
      summary: session.summary || 'No summary available',
      status: session.status,
      filesChanged: session.changes?.length || 0,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            sessions: formattedSessions,
            total: formattedSessions.length,
            filtered: dateFrom || dateTo ? true : false,
            cwd: effectiveCwd,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            sessions: [],
            error: error instanceof Error ? error.message : 'Failed to get session history',
          }, null, 2),
        },
      ],
    };
  }
}

async function handleAnalyzeSession(sessionId: string, cwd?: string) {
  try {
    const effectiveCwd = resolveCwd(cwd);
    const sessionsDir = join(effectiveCwd, '.trak/sessions');
    const files = await readdir(sessionsDir);
    
    for (const file of files) {
      const content = await readFile(join(sessionsDir, file), 'utf8');
      const session = deserializeSession(JSON.parse(content));
      
      if (session.id === sessionId) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(session, null, 2),
            },
          ],
        };
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: `Session with ID ${sessionId} not found`,
            cwd: effectiveCwd,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Failed to analyze session',
          }, null, 2),
        },
      ],
    };
  }
}

function calculateDuration(start: string, end: string): string {
  const duration = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.floor(duration / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

async function handleCreateGitHubIssue(issueData: any, sessionId: string, repoUrl?: string, cwd?: string) {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'GitHub token not configured. Please set GITHUB_TOKEN environment variable.',
            }, null, 2),
          },
        ],
      };
    }

    // Auto-detect repo or use provided URL
    let finalRepoUrl = repoUrl;
    if (!finalRepoUrl) {
      try {
        finalRepoUrl = detectGitRepositoryFromCwd(resolveCwd(cwd));
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Could not detect Git repository. Please provide repoUrl or ensure you are in a Git repository with a GitHub remote.',
              }, null, 2),
            },
          ],
        };
      }
    }

    // Parse repo URL (owner/repo format)
    const repoMatch = finalRepoUrl.match(/^([^\/]+)\/([^\/]+)$/);
    if (!repoMatch) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Invalid repo format. Use "owner/repo" format (e.g., "microsoft/vscode")',
            }, null, 2),
          },
        ],
      };
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

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            issueUrl: response.data.html_url,
            issueNumber: response.data.number,
            title: response.data.title,
          }, null, 2),
        },
      ],
    };

  } catch (error: any) {
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

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
          }, null, 2),
        },
      ],
    };
  }
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
  try {
    // Backwards compatible default to current process cwd
    return detectGitRepositoryFromCwd(process.cwd());
  } catch {
    throw new Error('Could not detect Git repository');
  }
}

function detectGitRepositoryFromCwd(cwd: string): string {
  try {
    // Get the remote origin URL
    const remoteUrl = execSync('git remote get-url origin', { 
      encoding: 'utf8',
      cwd,
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    
    // Parse GitHub URL formats:
    // https://github.com/owner/repo.git
    // git@github.com:owner/repo.git
    // https://github.com/owner/repo
    
    let match = remoteUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
    
    throw new Error('Not a GitHub repository');
  } catch (error) {
    throw new Error('Could not detect Git repository');
  }
}

async function handleLogin(orgToken: string, developerName: string, developerId: string) {
  try {
    const orgEndpoint = process.env.TRAK_ORG_ENDPOINT || 'https://api.trak.dev';
    
    // Create trak config directory if it doesn't exist
    const trakDir = join(homedir(), '.trak');
    await mkdir(trakDir, { recursive: true });
    
    // Create config object
    const config = {
      orgToken,
      developerName,
      developerId,
      orgEndpoint,
      lastLogin: new Date().toISOString(),
    };
    
    // Save config to ~/.trak/config.json
    const configPath = join(trakDir, 'config.json');
    await writeFile(configPath, JSON.stringify(config, null, 2));
    await chmod(configPath, 0o600);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Successfully logged in as ${developerName} (${developerId})`,
            orgEndpoint,
            lastLogin: config.lastLogin,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to login',
          }, null, 2),
        },
      ],
    };
  }
}

async function handleLogout() {
  try {
    const configPath = join(homedir(), '.trak', 'config.json');
    
    // Try to delete the config file
    await unlink(configPath);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Successfully logged out from organization dashboard',
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    // If file doesn't exist, that's fine - user wasn't logged in
    if ((error as any).code === 'ENOENT') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'No active login found',
            }, null, 2),
          },
        ],
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to logout',
          }, null, 2),
        },
      ],
    };
  }
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Trak MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
