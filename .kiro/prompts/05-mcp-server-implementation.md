# MCP Server Implementation Guide

## Overview
Implement the trak MCP server that exposes trak functionality as MCP tools for AI assistants (Kiro, Claude Desktop, etc.).

## Setup

### 1. Install Dependencies

```bash
npm install @modelcontextprotocol/sdk
```

### 2. Create MCP Server

**File**: `src/mcp/server.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createSessionManager } from '../services/sessionManager.js';

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

// Tool implementations
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'trak_start_session',
      description: 'Start a new trak session',
      inputSchema: {
        type: 'object',
        properties: {
          patterns: { type: 'array', items: { type: 'string' } },
          excludePatterns: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    {
      name: 'trak_stop_session',
      description: 'Stop current session and generate summary',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'trak_get_status',
      description: 'Get current session status',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'trak_get_session_history',
      description: 'Get list of past sessions',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
          offset: { type: 'number' }
        }
      }
    },
    {
      name: 'trak_analyze_session',
      description: 'Analyze specific session for issues',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string' }
        },
        required: ['sessionId']
      }
    }
  ]
}));

// Tool execution handler
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'trak_start_session':
      return await handleStartSession(args);
    case 'trak_stop_session':
      return await handleStopSession(args);
    case 'trak_get_status':
      return await handleGetStatus(args);
    case 'trak_get_session_history':
      return await handleGetSessionHistory(args);
    case 'trak_analyze_session':
      return await handleAnalyzeSession(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
server.connect(transport);
```

### 3. Tool Implementations

```typescript
async function handleStartSession(args: any) {
  const sessionManager = createSessionManager();
  
  if (sessionManager.isSessionActive()) {
    return {
      content: [{
        type: 'text',
        text: 'Session already active. Stop current session first.'
      }]
    };
  }
  
  const session = sessionManager.startSession();
  
  return {
    content: [{
      type: 'text',
      text: `Session started successfully. ID: ${session.id}`
    }]
  };
}

async function handleStopSession(args: any) {
  const sessionManager = createSessionManager();
  
  if (!sessionManager.isSessionActive()) {
    return {
      content: [{
        type: 'text',
        text: 'No active session to stop.'
      }]
    };
  }
  
  const session = sessionManager.stopSession();
  
  return {
    content: [{
      type: 'text',
      text: `Session stopped. Duration: ${session?.duration || 'unknown'}`
    }]
  };
}

async function handleGetStatus(args: any) {
  const sessionManager = createSessionManager();
  const session = sessionManager.getSession();
  
  if (!session) {
    return {
      content: [{
        type: 'text',
        text: 'No active session.'
      }]
    };
  }
  
  return {
    content: [{
      type: 'text',
      text: `Active session: ${session.id}, ${session.changes.length} files tracked`
    }]
  };
}
```

### 4. Executable Script

**File**: `src/mcp/cli.ts`

```typescript
#!/usr/bin/env node
import './server.js';
```

**Update package.json**:

```json
{
  "bin": {
    "trak": "./dist/cli.js",
    "trak-mcp-server": "./dist/mcp/cli.js"
  }
}
```

### 5. MCP Configuration

**Example mcp.json for users**:

```json
{
  "mcpServers": {
    "trak": {
      "command": "trak-mcp-server",
      "args": [],
      "env": {}
    }
  }
}
```

**For Kiro CLI** (`~/.kiro/mcp.json`):

```json
{
  "mcpServers": {
    "trak": {
      "command": "node",
      "args": ["/path/to/trak/dist/mcp/cli.js"],
      "env": {}
    }
  }
}
```

## Usage Examples

### AI Assistant Interaction

```
AI: I'll start tracking your coding session now.
> trak_start_session

AI: Session started successfully. I'll monitor your file changes.

[After coding...]

AI: Let me check your session status.
> trak_get_status
> Active session: 1234567890, 5 files tracked

AI: I'll stop the session and generate a summary.
> trak_stop_session
> Session stopped. Duration: 45 minutes
```

## Acceptance Criteria

### MCP Server Implementation
- ✅ Server implements stdio transport correctly
- ✅ All 5 tools are properly defined with schemas
- ✅ Input validation works for all tools
- ✅ Error handling covers edge cases
- ✅ Concurrent requests handled gracefully

### Tool Functionality
- ✅ trak_start_session creates new session
- ✅ trak_stop_session ends session with summary
- ✅ trak_get_status returns current session info
- ✅ trak_get_session_history lists past sessions
- ✅ trak_analyze_session returns detailed analysis

### Integration
- ✅ Works with Kiro CLI MCP configuration
- ✅ Compatible with Claude Desktop MCP setup
- ✅ Discoverable by MCP-compatible AI tools
- ✅ Maintains session state across tool calls
