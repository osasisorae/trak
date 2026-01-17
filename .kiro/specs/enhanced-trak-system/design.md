# Design: Enhanced Trak System

## Architecture Overview

The enhanced trak system extends the existing MVP with four new major components while maintaining backward compatibility.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI Layer (Commander)                     │
│  Commands: start, stop, status, dev, login, logout         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Service Layer                                │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ FileWatcher  │  │ SessionManager  │  │SummaryGenerator │ │
│  └──────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ CodeAnalyzer │  │ DashboardServer │  │   AuthManager   │ │
│  └──────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              MCP Server (stdio)                          │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              External Dependencies                           │
│  Chokidar | File System | OpenAI | Express | GitHub MCP    │
│  Organization API | MCP Protocol | Browser                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### CodeAnalyzer Service
**Responsibility**: Analyze code changes for quality issues and generate insights

**Key Methods**:
- `analyzeSession(session, fileContents)` - Perform comprehensive analysis
- `detectIssues(fileContent, filePath)` - Find specific issues in file
- `calculateMetrics(session)` - Generate quality metrics
- `generateSuggestions(issues)` - Create improvement recommendations

**Analysis Types**:
1. **Complexity Analysis**: Cyclomatic complexity, nesting depth, function length
2. **Duplication Detection**: Similar code blocks, repeated patterns
3. **Error Handling**: Missing try-catch, unhandled promises, error propagation
4. **Security Issues**: SQL injection, XSS vulnerabilities, hardcoded secrets
5. **Performance Problems**: Inefficient loops, memory leaks, blocking operations

**Data Model**:
```typescript
interface DetectedIssue {
  id: string;
  type: 'complexity' | 'duplication' | 'error-handling' | 'security' | 'performance';
  severity: 'high' | 'medium' | 'low';
  filePath: string;
  lineNumber: number;
  description: string;
  suggestedFix: string;
  codeExample?: {
    before: string;
    after: string;
  };
}

interface AnalysisResult {
  issues: DetectedIssue[];
  metrics: {
    qualityScore: number;
    complexity: number;
    duplication: number;
    testCoverage?: number;
  };
  suggestions: string[];
  analysisTime: number;
}
```

### DashboardServer Service
**Responsibility**: Serve local web dashboard for session visualization

**Key Methods**:
- `start(port?)` - Launch Express server on available port
- `stop()` - Shutdown server gracefully
- `getAvailablePort(startPort)` - Find open port
- `setupRoutes()` - Configure API endpoints and static serving
- `broadcastUpdate(sessionData)` - Send real-time updates to clients

**API Endpoints**:
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:id` - Get specific session with analysis
- `GET /api/sessions/current` - Get active session
- `POST /api/github/create-issue` - Create GitHub issue from detected problem
- `WebSocket /ws` - Real-time updates

### MCP Server
**Responsibility**: Expose trak functionality as MCP tools for AI assistants

**Tool Definitions**:
- `trak_start_session` - Start a new trak session
- `trak_stop_session` - Stop current session and generate summary
- `trak_get_status` - Get current session status
- `trak_get_session_history` - Get list of past sessions
- `trak_analyze_session` - Analyze specific session for issues

**Implementation**:
- Uses stdio transport for communication
- Validates all tool inputs against schemas
- Returns structured responses with error handling
- Supports concurrent tool execution
- Maintains session state across tool calls

### AuthManager Service
**Responsibility**: Handle organization authentication and session reporting

**Key Methods**:
- `login(orgToken)` - Validate and store organization credentials
- `logout()` - Clear stored credentials
- `isLoggedIn()` - Check authentication status
- `getOrganization()` - Get current organization info
- `reportSession(session, analysis)` - Send session report to org endpoint

**Configuration Storage**: `~/.trak/config.json` with 600 permissions

## Data Flow

### Enhanced Session Stop Flow
```
User: trak stop
  → SessionManager.stopSession()
  → CodeAnalyzer.analyzeSession(session, fileContents)
  → SummaryGenerator.generateSummary(session, analysis)
  → AuthManager.reportSession(session, analysis) [if logged in]
  → Archive session with analysis to .trak/sessions/
  → Display enhanced summary with issues and metrics
```

### Dashboard Launch Flow
```
User: trak dev
  → DashboardServer.getAvailablePort(3000)
  → DashboardServer.start(port)
  → Open browser to http://localhost:port
  → Serve dashboard UI
  → WebSocket connection for real-time updates
  → Load session data and analysis results
```

### MCP Tool Execution Flow
```
AI Assistant: trak_start_session
  → MCP Server validates input schema
  → Call SessionManager.startSession()
  → Call FileWatcher.start()
  → Return structured response with session info
  → AI Assistant receives confirmation
```

## Error Handling Strategy

### Graceful Degradation
- Analysis fails → Use basic summary without issues
- Dashboard fails → CLI still works normally
- GitHub MCP unavailable → Show error, continue without integration
- Organization endpoint down → Queue reports for later transmission
- MCP server crashes → Restart automatically, maintain tool availability

### Recovery Mechanisms
- Exponential backoff for network retries
- Circuit breaker pattern for external services
- Fallback modes for each major feature
- Automatic service restart for critical components
- User notification with actionable guidance

## Security Considerations

### Credential Management
- Organization tokens stored with 600 file permissions
- No credentials in logs or error messages
- Token validation before storage
- Secure transmission (HTTPS only)
- Automatic token refresh if supported

### Data Privacy
- Local-first architecture (data stays on developer machine)
- Opt-in for organization reporting
- Configurable data sharing levels
- No sensitive code content in reports (only metadata)
- Clear privacy policy and data handling

## Performance Optimization

### Analysis Performance
- Parallel file processing
- Incremental analysis (only changed files)
- Caching of analysis results
- Configurable timeout limits
- Memory-efficient AST parsing

### Dashboard Performance
- Lazy loading of session data
- Client-side caching
- Efficient WebSocket updates
- Compressed static assets
- Responsive design for mobile

### MCP Server Performance
- Connection pooling
- Request queuing
- Timeout handling
- Memory management
- Concurrent tool execution
