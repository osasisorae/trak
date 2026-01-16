# Design: trak Core

## Architecture Overview

`trak` follows a layered architecture with clear separation between CLI, business logic, and external services.

```
┌─────────────────────────────────────────┐
│           CLI Layer (Commander)          │
│  Commands: start, stop, status          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Service Layer                    │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │ FileWatcher  │  │ SessionManager  │ │
│  └──────────────┘  └─────────────────┘ │
│  ┌──────────────────────────────────┐  │
│  │     SummaryGenerator             │  │
│  └──────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      External Dependencies               │
│  Chokidar | File System | OpenAI API    │
└─────────────────────────────────────────┘
```

## Components

### FileWatcher
**Responsibility**: Monitor file system changes during active sessions

**Key Methods**:
- `start()` - Begin watching files
- `stop()` - Stop watching
- `onFileChange(callback)` - Register change handler

**Events Emitted**:
- `change` - File added, modified, or deleted

**Configuration**:
- Patterns: File globs to watch
- Exclude patterns: Directories/files to ignore
- Debounce: Milliseconds to wait before emitting change
- Working directory

### SessionManager
**Responsibility**: Manage session lifecycle and persistence

**Key Methods**:
- `startSession()` - Create new session
- `stopSession()` - End session and archive
- `getSession()` - Retrieve current session
- `isSessionActive()` - Check if session running
- `addChange(change)` - Record file change

**Data Model**:
```typescript
Session {
  id: string
  startTime: Date
  endTime?: Date
  cwd: string
  changes: SessionChange[]
  status: 'active' | 'stopped'
}

SessionChange {
  path: string
  type: 'add' | 'change' | 'unlink'
  timestamp: Date
  changeCount: number
}
```

**Storage**:
- Active: `.trak/current-session.json`
- Archived: `.trak/sessions/{timestamp}-session.json`

### SummaryGenerator
**Responsibility**: Generate AI summaries of coding sessions

**Key Methods**:
- `generateSummary(session)` - Create summary from session data
- `formatSummary(summary)` - Format for display

**Integration**:
- OpenAI API (GPT-4 or GPT-3.5-turbo)
- Prompt engineering for context-aware summaries
- Error handling for API failures

## Data Flow

### Starting a Session
```
User: trak start
  → CLI validates no active session
  → SessionManager.startSession()
  → Create session object
  → Persist to .trak/current-session.json
  → FileWatcher.start()
  → Register change handler
  → Display confirmation
```

### During Session
```
File changes in directory
  → Chokidar detects change
  → FileWatcher filters by patterns
  → Emit 'change' event
  → SessionManager.addChange()
  → Deduplicate by path
  → Persist updated session
```

### Stopping a Session
```
User: trak stop
  → CLI validates active session
  → FileWatcher.stop()
  → SessionManager.stopSession()
  → Archive to .trak/sessions/
  → SummaryGenerator.generateSummary()
  → Call OpenAI API
  → Display summary
  → Clear current session
```

## Error Handling

### User Errors
- Starting when session active → Clear message
- Stopping when no session → Suggest `trak start`
- Missing API key → Instructions to configure

### System Errors
- File system errors → Log and continue
- API failures → Show error, save session anyway
- Invalid session data → Recover or reset

## Configuration

### Environment Variables
- `OPENAI_API_KEY` - Required for summaries

### Future Configuration
- `.trakrc` file for user preferences
- Custom patterns and exclusions
- AI model selection
- Summary format options
