# 🚀 Trak - AI-Powered Development Tracking

> **Track your coding sessions, analyze code quality, and enhance your development workflow with AI-powered insights.**

Trak is an intelligent development tracking tool that monitors your coding sessions, analyzes code quality in real-time, and provides actionable insights to improve your development process. Built for individual developers and teams, trak seamlessly integrates with modern development workflows.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## ✨ Key Features

🎯 **Smart Session Tracking**
- Automatic file change monitoring during coding sessions
- Real-time development activity detection
- Session duration and productivity metrics

🔍 **AI-Powered Code Analysis**
- Quality scoring (0-100) with detailed metrics
- Issue detection across multiple categories (security, performance, complexity)
- Actionable suggestions for code improvements
- Support for 18+ programming languages

📊 **Beautiful Dashboard**
- Modern, responsive web interface
- Interactive session history and analytics
- Real-time quality insights and trends
- One-click GitHub issue creation

🤖 **AI Assistant Integration**
- Model Context Protocol (MCP) server for seamless AI integration
- 6 powerful tools for automated development tracking
- Perfect integration with Kiro CLI and other AI assistants

🏢 **Organization Support**
- Team dashboard integration
- Automatic session reporting
- Developer productivity insights
- Privacy-focused (only metadata shared)

🔗 **GitHub Integration**
- Auto-detect repository from Git remote
- Create issues directly from detected problems
- Professional issue formatting with labels
- Comprehensive error handling

## 🚀 Quick Start

### Installation

```bash
# Clone and install
git clone https://github.com/osasisorae/trak.git
cd trak
npm install
npm run build
npm link

# Set up environment
cp .env.example .env
# Add your OPENAI_API_KEY and GITHUB_TOKEN
```

### Basic Usage

```bash
# Start tracking your coding session
trak start

# Make some code changes...
# Edit files, run tests, commit code

# Stop and generate AI analysis
trak stop

# View detailed insights in dashboard
trak dev
```

## 📖 Complete Usage Guide

### Core Commands

#### `trak start`
Begin tracking a new coding session in the current directory.

```bash
trak start
# 🟢 Session started. Tracking changes...
# Press Ctrl+C or run 'trak stop' to end session
```

#### `trak stop`
Stop the current session and generate comprehensive AI analysis.

```bash
trak stop
# ⏳ Analyzing code and generating summary...
# 
# 📊 Session Summary
# ─────────────────────
# Duration: 45m
# Files: 3 added, 7 modified, 1 deleted
# 
# 🔍 Code Analysis:
#    Quality Score: 78/100
#    Issues Found: 4 (1 high, 2 medium, 1 low)
# 
#    Top Issues:
#    🔴 security: Hardcoded API key detected
#       📁 src/config.ts:12
#    🟡 complexity: Function has high cyclomatic complexity
#       📁 src/utils.ts:45
# 
# ✅ Session saved to .trak/sessions/2026-01-17-session.json
# 💡 Run "trak dev" to view detailed analysis in the dashboard
```

#### `trak status`
View current session status and authentication information.

```bash
trak status
# 🔐 Authentication Status
# ─────────────────────
# ✅ Logged in as: John Doe (john@company.com)
# 🏢 Organization: https://api.company.com/trak
# 📅 Last login: 1/17/2026, 2:15:30 AM
# 
# 📍 Active Session
# ─────────────────────
# ID: 1768609239824
# Started: 23 minutes ago
# Duration: 23m 45s
# 
# Files tracked: 12
#   ➕ 2 added
#   📝 8 modified
#   🗑️ 2 deleted
```

#### `trak dev`
Launch the interactive developer dashboard.

```bash
trak dev
# 🚀 Dashboard server starting on http://localhost:3000
# 🌐 Browser opened to http://localhost:3000
```

### Organization Integration

#### `trak login <org-token>`
Connect to your organization's dashboard for team tracking.

```bash
trak login demo-token-123
# Enter your name: John Doe
# Enter your developer ID (email or username): john@company.com
# ✅ Successfully logged in to organization
# 📋 Developer: John Doe (john@company.com)
# 🏢 Organization endpoint: https://api.trak.dev/report
# 💡 Your sessions will now be reported to your organization dashboard
```

#### `trak logout`
Disconnect from organization dashboard.

```bash
trak logout
# ✅ Successfully logged out
# 💡 Your sessions will no longer be reported to organization dashboard
```

## 🤖 AI Assistant Integration (MCP)

Trak includes a Model Context Protocol server that enables AI assistants to control trak sessions automatically.

### Available MCP Tools

1. **`trak_start_session`** - Start tracking a session
2. **`trak_stop_session`** - Stop session and generate analysis  
3. **`trak_get_status`** - Get current session status
4. **`trak_get_session_history`** - Query past sessions
5. **`trak_analyze_session`** - Get detailed analysis of specific session
6. **`trak_create_github_issue`** - Create GitHub issues from detected code problems

### Setup for AI Assistants

1. **Build the project**: `npm run build`
2. **Test the MCP server**: `npm run mcp-server`
3. **Configure your AI assistant** using the example in `mcp-config-example.json`

For Kiro CLI, add to your MCP configuration:

```json
{
  "mcpServers": {
    "trak": {
      "command": "node",
      "args": ["/absolute/path/to/trak/dist/mcp-server.js"],
      "env": {
        "OPENAI_API_KEY": "your_openai_api_key_here",
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### Testing MCP Integration

```bash
# List available tools
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | npm run mcp-server

# Get current status
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "trak_get_status", "arguments": {}}}' | npm run mcp-server
```

## 🔗 Kiro CLI Integration

Trak integrates seamlessly with [Kiro CLI](https://kiro.ai) to provide **automatic development tracking** and **enhanced AI assistance**.

### Enhanced Features with Kiro

🚀 **Automatic Session Management**
- Sessions start automatically when Kiro agent spawns
- Sessions stop automatically when agent finishes
- No manual `trak start/stop` commands needed

🔍 **Real-time Code Quality Monitoring**  
- Monitor file changes during development
- Provide quality insights after code modifications
- Track build/test commands and development activity

🚫 **Quality Gates**
- Block git commits with quality score < 60
- Prevent commits with > 5 high-priority issues
- Maintain code quality standards automatically

📊 **Enhanced AI Context**
- Kiro agents receive real-time session statistics
- AI assistance informed by actual coding patterns
- Quality insights integrated into development workflow

### Quick Setup

```bash
# Copy integration files to your project
cp -r kiro-integration/ /path/to/your/project/

# Configure your Kiro agent using the provided configuration
# Use kiro-integration/kiro-agent-config.json

# Start coding with Kiro - trak works automatically!
kiro-cli chat
```

## 🏢 Organization Dashboard (Demo)

For hackathon demonstration, run a mock organization server:

```bash
# Install dependencies and run mock server
cd demo
npm init -y
npm install express
node mock-org-server.js
```

Then login to trak with the mock server:

```bash
# Set environment variable to use local mock server
export TRAK_ORG_ENDPOINT=http://localhost:3001

# Login with any token (for demo)
trak login demo-token-123

# Your sessions will now be sent to the mock server
trak start
# ... make some code changes ...
trak stop
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with your API keys:

```env
OPENAI_API_KEY=your_openai_api_key_here
GITHUB_TOKEN=your_github_token_here
TRAK_ORG_ENDPOINT=https://api.trak.dev/report
```

### GitHub Integration

To enable GitHub issue creation from the dashboard:

1. Go to GitHub Settings → Developer settings → Personal access tokens → **Tokens (classic)**
2. Click "Generate new token (classic)" (**Important: Use classic tokens, not fine-grained**)
3. Select scopes: `repo` (for private repos) or `public_repo` (for public repos only)
4. Copy the token and add it to your `.env` file

### Troubleshooting GitHub Integration

**Error: "Resource not accessible by personal access token"**

This error occurs when using fine-grained tokens instead of classic tokens. To fix:

1. **Use classic tokens**: Make sure you created a "Token (classic)" not a "Fine-grained personal access token"
2. **Check token scopes**: Your token needs `repo` scope (full repository access) or `public_repo` scope (for public repositories only)
3. **Regenerate token**: Go to GitHub Settings → Developer settings → Personal access tokens
4. **Update .env file**: Replace the old token with the new one
5. **Restart trak dev**: The server needs to restart to pick up the new token

## 🏗️ Architecture

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

## 🛠️ Development

### Prerequisites

- Node.js 18+
- TypeScript 5.0+
- OpenAI API key
- GitHub personal access token (optional)

### Setup

```bash
git clone https://github.com/osasisorae/trak.git
cd trak
npm install
npm run build
```

### Testing

```bash
npm test
```

### Building

```bash
npm run build
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Run tests: `npm test`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT API
- The Kiro CLI team for MCP integration
- All contributors and beta testers

---

**Built with ❤️ for developers who care about code quality**
