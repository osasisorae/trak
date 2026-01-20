#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createSessionManager, deserializeSession } from './services/sessionManager.js';
import { createSummaryGenerator } from './services/summaryGenerator.js';
import { createCodeAnalyzer } from './services/codeAnalyzer.js';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

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
          properties: {},
        },
      },
      {
        name: 'trak_get_status',
        description: 'Get current session status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'trak_get_session_history',
        description: 'Query past sessions with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
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
        return await handleStopSession();

      case 'trak_get_status':
        return await handleGetStatus();

      case 'trak_get_session_history':
        return await handleGetSessionHistory(
          args?.limit as number | undefined, 
          args?.dateFrom as string | undefined, 
          args?.dateTo as string | undefined
        );

      case 'trak_analyze_session':
        if (!args?.sessionId) {
          throw new Error('sessionId is required');
        }
        return await handleAnalyzeSession(args.sessionId as string);

      case 'trak_create_github_issue':
        if (!args?.issueData || !args?.sessionId) {
          throw new Error('issueData and sessionId are required');
        }
        return await handleCreateGitHubIssue(
          args.issueData as any,
          args.sessionId as string,
          args.repoUrl as string | undefined
        );

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
  const sessionManager = createSessionManager(cwd);
  
  try {
    const session = sessionManager.startSession();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            sessionId: session.id,
            message: `Session started. Tracking changes in ${session.cwd}`,
            startTime: session.startTime.toISOString(),
            cwd: session.cwd,
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

async function handleStopSession() {
  const sessionManager = createSessionManager();
  
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
            }, null, 2),
          },
        ],
      };
    }

    // Stop session and generate analysis
    const stoppedSession = sessionManager.stopSession();
    if (!stoppedSession) {
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

    const codeAnalyzer = createCodeAnalyzer();
    const summaryGenerator = createSummaryGenerator();

    // Read file contents for analysis (simplified for MCP)
    const fileContents = new Map<string, string>();
    
    // Generate summary and analysis together
    const result = await summaryGenerator.generateSummary(stoppedSession, fileContents);
    
    // Create final session object
    const finalSession = {
      ...stoppedSession,
      summary: result.summary,
      analysis: result.analysis,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            sessionId: finalSession.id,
            summary: finalSession.summary,
            qualityScore: finalSession.analysis.metrics.qualityScore,
            issuesFound: finalSession.analysis.issues.length,
            duration: calculateDuration(finalSession.startTime.toISOString(), finalSession.endTime?.toISOString() || new Date().toISOString()),
            analysis: finalSession.analysis,
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

async function handleGetStatus() {
  const sessionManager = createSessionManager();
  
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
            }, null, 2),
          },
        ],
      };
    }

    const duration = calculateDuration(session.startTime.toISOString(), new Date().toISOString());
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            active: true,
            sessionId: session.id,
            duration,
            filesChanged: session.changes.length,
            startTime: session.startTime.toISOString(),
            cwd: session.cwd,
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

async function handleGetSessionHistory(limit = 10, dateFrom?: string, dateTo?: string) {
  try {
    const sessionsDir = join(process.cwd(), '.trak/sessions');
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

async function handleAnalyzeSession(sessionId: string) {
  try {
    const sessionsDir = join(process.cwd(), '.trak/sessions');
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

async function handleCreateGitHubIssue(issueData: any, sessionId: string, repoUrl?: string) {
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
        finalRepoUrl = detectGitRepository();
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
    // Get the remote origin URL
    const remoteUrl = execSync('git remote get-url origin', { 
      encoding: 'utf8',
      cwd: process.cwd()
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Trak MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
