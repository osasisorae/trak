# Requirements: Fix Organization Reporting

## Overview
The organization reporting system was implemented incorrectly and doesn't match the design specification. The current implementation has authentication logic scattered across multiple files and the reporting fails silently. This spec will fix the implementation to match the original design.

## R1: Consolidate Auth Logic into AuthManager Service
**Priority**: Critical  
**Status**: Not Started

**Description**: Create a proper AuthManager service that handles all organization authentication and reporting logic, matching the design specification.

**Acceptance Criteria**:
- Create `src/services/authManager.ts` with factory pattern `createAuthManager()`
- Move login/logout logic from `src/commands/login.ts` into AuthManager
- Move session reporting logic from `src/services/orgReporter.ts` into AuthManager
- AuthManager methods: `login()`, `logout()`, `isLoggedIn()`, `getConfig()`, `reportSession()`
- Commands (`login.ts`, `logout.ts`) become thin wrappers that call AuthManager
- Remove `orgReporter.ts` service (functionality moved to AuthManager)

## R2: Fix Session Reporting Implementation
**Priority**: Critical  
**Status**: Not Started

**Description**: Fix the actual session reporting to work correctly with the mock organization server.

**Acceptance Criteria**:
- Session reports successfully reach the mock organization server
- Reports include all required fields: developerId, developerName, sessionId, timestamp, duration, files, summary, qualityScore, issues
- Network errors are logged with full details (not swallowed silently)
- Retry logic works with exponential backoff (3 attempts)
- Success/failure is clearly communicated to the user
- Offline mode queues reports for later transmission (optional enhancement)

## R3: Improve Error Handling and Logging
**Priority**: High  
**Status**: Not Started

**Description**: Add proper error handling and logging throughout the organization reporting flow.

**Acceptance Criteria**:
- All errors in the reporting flow are logged with context
- Network failures show the actual error message
- Invalid configuration is detected and reported clearly
- Users get actionable error messages (e.g., "Check your network connection")
- Debug mode available via environment variable for troubleshooting

## Success Criteria

### Functional Success
- `trak login <token>` successfully authenticates with organization
- `trak stop` sends session report to organization server
- Mock organization server receives and displays the report
- Network failures are handled gracefully with retries
- Users see clear success/failure messages

### Code Quality Success
- AuthManager service follows the same patterns as other services
- Code matches the design specification architecture
- No authentication logic in command files (only in AuthManager)
- Proper separation of concerns
- Clean error handling without silent failures

## Implementation Notes

### Current Issues
1. No AuthManager service exists (design calls for it)
2. `orgReporter.ts` is separate from auth logic (should be unified)
3. Errors are caught and swallowed in `stop.ts` without proper logging
4. Session reporting happens in `stop.ts` instead of being delegated to a service
5. The mock server message says to use `/report` endpoint but that's incorrect

### Design Alignment
The fix should align with the original design document which specifies:
- AuthManager service with clear responsibilities
- Clean separation between commands and services
- Proper error handling with graceful degradation
- User-friendly error messages
