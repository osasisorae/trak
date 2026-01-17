# Testing Infrastructure Specification

## Overview
Implement comprehensive testing suite for trak using Vitest and fast-check for property-based testing, following the project standards.

## Testing Strategy

### 1. Unit Tests
Test individual services in isolation with mocked dependencies.

**Services to Test:**
- [ ] `FileWatcher` - Event emission, pattern matching, debouncing
- [ ] `SessionManager` - CRUD operations, persistence, validation
- [ ] `CodeAnalyzer` - Analysis logic, issue detection, scoring
- [ ] `SummaryGenerator` - OpenAI integration, prompt formatting
- [ ] `OrgReporter` - HTTP requests, retry logic, error handling
- [ ] `DashboardServer` - Express routes, WebSocket, static serving

### 2. Integration Tests
Test complete workflows end-to-end with real file system operations.

**Workflows to Test:**
- [ ] Complete session lifecycle (start → changes → stop → analysis)
- [ ] Organization reporting flow (login → session → report)
- [ ] Dashboard server startup and API endpoints
- [ ] File watching with real file changes
- [ ] Session persistence and recovery

### 3. Property-Based Tests
Use fast-check for data transformation and validation testing.

**Properties to Test:**
- [ ] Session data serialization/deserialization
- [ ] File path normalization and filtering
- [ ] Analysis result aggregation
- [ ] Configuration validation

## Test Structure

```
test/
├── unit/
│   ├── services/
│   │   ├── fileWatcher.test.ts
│   │   ├── sessionManager.test.ts
│   │   ├── codeAnalyzer.test.ts
│   │   ├── summaryGenerator.test.ts
│   │   ├── orgReporter.test.ts
│   │   └── dashboardServer.test.ts
│   └── commands/
│       ├── start.test.ts
│       ├── stop.test.ts
│       ├── status.test.ts
│       ├── login.test.ts
│       ├── logout.test.ts
│       └── dev.test.ts
├── integration/
│   ├── session-lifecycle.test.ts
│   ├── org-reporting.test.ts
│   ├── dashboard-api.test.ts
│   └── file-watching.test.ts
├── property/
│   ├── session-data.test.ts
│   ├── file-filtering.test.ts
│   └── analysis-aggregation.test.ts
├── fixtures/
│   ├── sample-sessions/
│   ├── test-files/
│   └── mock-responses/
└── helpers/
    ├── test-utils.ts
    ├── mock-factories.ts
    └── temp-directory.ts
```

## Mock Strategy

### External Dependencies
- **OpenAI API** - Mock with predefined responses
- **File System** - Use temp directories for integration tests
- **HTTP Requests** - Mock with MSW (Mock Service Worker)
- **Process/Environment** - Mock with vi.stubEnv()

### Internal Dependencies
- **Services** - Mock with vi.mock() for unit tests
- **Commands** - Test with real services for integration tests

## Test Configuration

### Vitest Setup
- [ ] Configure `vitest.config.ts`
- [ ] Set up test environment with Node.js
- [ ] Configure path aliases to match TypeScript
- [ ] Enable coverage reporting
- [ ] Set up watch mode for development

### Fast-Check Integration
- [ ] Install and configure fast-check
- [ ] Create custom arbitraries for domain objects
- [ ] Set up property test runners

## Implementation Tasks

### Phase 1: Infrastructure Setup ✅
- [x] Install testing dependencies (vitest, fast-check, @types/node)
- [x] Create vitest.config.ts
- [x] Set up test scripts in package.json
- [x] Create test directory structure
- [x] Implement test utilities and helpers

### Phase 2: Unit Tests ⏳
- [x] Mock external dependencies (OpenAI, HTTP, FS)
- [x] Test SessionManager methods individually
- [x] Test error conditions and edge cases
- [ ] Test FileWatcher service methods
- [ ] Test CodeAnalyzer service methods
- [ ] Test remaining services (SummaryGenerator, OrgReporter, DashboardServer)

### Phase 3: Integration Tests ⏳
- [x] Set up temporary directory management
- [x] Test session lifecycle workflow
- [x] Test file watching with real file operations
- [ ] Test organization reporting flow
- [ ] Test dashboard server startup and API endpoints

### Phase 4: Property-Based Tests ✅
- [x] Create arbitraries for Session, FileChange, AnalysisResult
- [x] Test serialization round-trips
- [x] Test data transformation properties
- [x] Validate business rule invariants

## Success Criteria

### Coverage Targets
- **Unit Tests**: >80% line coverage
- **Integration Tests**: All major workflows covered
- **Property Tests**: All data transformations tested

### Quality Gates
- All tests pass in CI/CD
- No flaky tests (consistent results)
- Fast execution (<30 seconds for full suite)
- Clear test failure messages

### Maintainability
- Tests are easy to understand and modify
- Good separation between unit and integration tests
- Reusable test utilities and fixtures
- Comprehensive documentation for test patterns
