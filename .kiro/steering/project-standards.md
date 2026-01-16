# Project Standards

## Overview
`trak` is a CLI tool that tracks coding sessions and generates AI-powered summaries of development work. It monitors file changes during active sessions and uses OpenAI to create meaningful summaries of what was accomplished.

## Technology Stack
- **Language**: TypeScript with ES modules
- **CLI Framework**: Commander.js
- **File Watching**: Chokidar
- **AI Integration**: OpenAI API
- **Testing**: Vitest with fast-check for property-based testing

## Code Patterns

### Module System
- Use ES modules (`import`/`export`)
- File extensions in imports: `.js` (TypeScript compiles to JS)
- Top-level async/await supported

### CLI Structure
- Entry point: `src/cli.ts`
- Commands in `src/commands/`
- Services in `src/services/`
- Each command is a separate module with exported async function

### Service Layer
- Services are classes with factory functions
- Factory pattern: `createServiceName(config?)`
- Services handle single responsibility (file watching, session management, AI summaries)

## File Naming Conventions
- camelCase for files: `fileWatcher.ts`, `sessionManager.ts`
- PascalCase for classes: `FileWatcher`, `SessionManager`
- Interfaces prefixed with type name: `FileWatcherConfig`, `Session`

## Error Handling
- User-facing errors should be clear and actionable
- Log errors to console with context
- Graceful degradation where possible

## Testing Approach
- Unit tests for services
- Property-based tests for data transformations
- Integration tests for CLI commands
- Mock external dependencies (file system, OpenAI API)

## Data Persistence
- Session data stored in `.trak/` directory
- Current session: `.trak/current-session.json`
- Historical sessions: `.trak/sessions/YYYY-MM-DD-HH-mm-session.json`
- Git-ignored by default
