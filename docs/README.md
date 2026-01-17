# Trak Documentation Assets

This directory contains documentation assets including screenshots, diagrams, and example outputs.

## Screenshots

### Dashboard Interface
- `dashboard-overview.png` - Main dashboard showing session list and quality scores
- `dashboard-session-detail.png` - Detailed session view with issue breakdown
- `dashboard-github-integration.png` - GitHub issue creation modal

### CLI Interface
- `cli-session-start.png` - Starting a trak session
- `cli-session-stop.png` - Session completion with analysis results
- `cli-status.png` - Session status display

### Integration Examples
- `kiro-integration.png` - Kiro CLI with automatic trak session management
- `mcp-tools.png` - MCP server tools list

## Architecture Diagrams

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLI Commands  │    │  Web Dashboard  │    │  MCP Server     │
│                 │    │                 │    │                 │
│ • start/stop    │    │ • Session view  │    │ • 6 MCP tools   │
│ • status        │    │ • Quality       │    │ • JSON-RPC      │
│ • login/logout  │    │   insights      │    │ • AI assistant  │
│ • dev           │    │ • GitHub issues │    │   integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Core Services  │
                    │                 │
                    │ • SessionManager│
                    │ • CodeAnalyzer  │
                    │ • SummaryGen    │
                    │ • OrgReporter   │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Data Layer    │
                    │                 │
                    │ • .trak/        │
                    │   sessions/     │
                    │ • ~/.trak/      │
                    │   config.json   │
                    └─────────────────┘
```

### Data Flow
```
Developer → CLI Commands → Session Manager → File Watcher
                                ↓
                         Code Analyzer ← File Changes
                                ↓
                         Summary Generator ← OpenAI API
                                ↓
                         Session Storage → Dashboard
                                ↓
                         Organization Reporter → Team Dashboard
```

### Integration Flow
```
Kiro Agent Spawn → Hook Script → trak start → Session Active
                                                    ↓
File Changes → Hook Script → Monitor & Insights → Real-time Feedback
                                                    ↓
Agent Stop → Hook Script → trak stop → Analysis → Enhanced Context
```

## Example Outputs

### Session Analysis Example
```json
{
  "id": "1768609239824",
  "startTime": "2026-01-17T00:20:39.824Z",
  "endTime": "2026-01-17T00:24:13.328Z",
  "summary": "Enhanced code analysis and GitHub integration implementation",
  "analysis": {
    "metrics": {
      "qualityScore": 78,
      "complexity": 12,
      "duplication": 2,
      "issueCount": {
        "high": 1,
        "medium": 3,
        "low": 2
      }
    },
    "issues": [
      {
        "id": "issue-1",
        "type": "security",
        "severity": "high",
        "filePath": "src/config.ts",
        "lineNumber": 12,
        "description": "Hardcoded API key detected in configuration file",
        "suggestion": "Use environment variables to store sensitive information"
      }
    ]
  }
}
```

### MCP Tools Response Example
```json
{
  "result": {
    "tools": [
      {
        "name": "trak_start_session",
        "description": "Start tracking a coding session",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cwd": {
              "type": "string",
              "description": "Working directory to track"
            }
          }
        }
      }
    ]
  }
}
```

## Usage Examples

### Basic Workflow
```bash
$ trak start
🟢 Session started. Tracking changes...

$ # Make some code changes...

$ trak stop
⏳ Analyzing code and generating summary...

📊 Session Summary
─────────────────────
Duration: 45m
Files: 3 added, 7 modified, 1 deleted

🔍 Code Analysis:
   Quality Score: 78/100
   Issues Found: 4 (1 high, 2 medium, 1 low)
```

### Organization Integration
```bash
$ trak login demo-token-123
Enter your name: John Doe
Enter your developer ID: john@company.com
✅ Successfully logged in to organization

$ trak status
🔐 Authentication Status
─────────────────────
✅ Logged in as: John Doe (john@company.com)
🏢 Organization: https://api.trak.dev/report
```

### Kiro Integration
```bash
$ kiro-cli chat
🚀 Trak session started automatically for development tracking
📊 Your coding activity will be analyzed for quality insights

# AI assistance with automatic tracking...

📊 Stopping trak session and generating analysis...
✅ Trak session completed - code quality analysis generated
```

## File Structure

```
trak/
├── src/                    # Source code
│   ├── commands/          # CLI commands
│   ├── services/          # Core services
│   └── types/            # TypeScript types
├── public/               # Dashboard assets
├── kiro-integration/     # Kiro CLI integration
├── demo/                # Demo server
├── docs/                # Documentation
└── .trak/               # Session data (created at runtime)
```

## API Reference

### CLI Commands
- `trak start` - Start session tracking
- `trak stop` - Stop session and analyze
- `trak status` - Show current status
- `trak dev` - Launch dashboard
- `trak login <token>` - Login to organization
- `trak logout` - Logout from organization

### MCP Tools
- `trak_start_session` - Start tracking session
- `trak_stop_session` - Stop and analyze session
- `trak_get_status` - Get current session status
- `trak_get_session_history` - Query past sessions
- `trak_analyze_session` - Get detailed session analysis
- `trak_create_github_issue` - Create GitHub issue from detected problem

### Dashboard API
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:id` - Get session details
- `GET /api/current` - Get current active session
- `GET /api/repo-info` - Get repository information
- `POST /api/issues/create` - Create GitHub issue
