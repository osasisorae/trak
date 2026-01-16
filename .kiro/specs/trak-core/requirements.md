# Requirements: trak Core

## Requirement 1: Session Tracking
**Priority**: Critical  
**Status**: ✅ Complete

### Description
Users must be able to start and stop coding session tracking via CLI commands.

### Acceptance Criteria
- ✅ `trak start` initiates a new tracking session
- ✅ `trak stop` ends the current session
- ✅ `trak status` shows current session information
- ✅ Only one session can be active at a time
- ✅ Session state persists across terminal restarts
- ✅ Error handling for invalid states (e.g., stopping when no session active)

### Technical Notes
- Session data stored in `.trak/current-session.json`
- Session includes: id, start time, end time, working directory, status

---

## Requirement 2: File Change Monitoring
**Priority**: Critical  
**Status**: ✅ Complete

### Description
Track file changes during active sessions to understand what code was modified.

### Acceptance Criteria
- ✅ Monitor file additions, modifications, and deletions
- ✅ Support common programming languages (TS, JS, Python, Go, Rust)
- ✅ Exclude build artifacts and dependencies (node_modules, dist, etc.)
- ✅ Debounce rapid changes to avoid noise
- ✅ Track change count per file
- ✅ Persist changes to session data

### Technical Notes
- Use chokidar for file watching
- Polling mode for reliability across platforms
- Configurable patterns and exclusions

---

## Requirement 3: AI-Powered Session Summaries
**Priority**: Critical  
**Status**: ✅ Complete

### Description
Generate intelligent summaries of coding sessions using AI to help developers document their work.

### Acceptance Criteria
- ✅ Generate summary when session stops
- ✅ Summary includes: files changed, types of changes, inferred purpose
- ✅ Use OpenAI API for natural language generation
- ✅ Handle API errors gracefully
- ✅ Display summary in terminal
- ✅ Save summary with session data

### Technical Notes
- OpenAI API key from environment variable
- Prompt engineering for quality summaries
- Token limit considerations

---

## Requirement 4: Session History
**Priority**: High  
**Status**: ✅ Complete

### Description
Maintain historical record of past sessions for reference and analysis.

### Acceptance Criteria
- Archive completed sessions to `.trak/sessions/`
- Filename format: `YYYY-MM-DD-HH-mm-session.json`
- Include full session data and AI summary
- Command to list past sessions
- Command to view specific session details

### Technical Notes
- JSON format for easy parsing
- Consider storage limits for long-term use
