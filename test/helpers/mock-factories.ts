import type { Session, FileChange, AnalysisResult, DetectedIssue } from '../../src/types/index.js'

/**
 * Create a mock session for testing
 */
export function createMockSession(overrides: Partial<Session> = {}): Session {
  return {
    id: Date.now().toString(),
    startTime: new Date(),
    endTime: undefined,
    cwd: '/test',
    changes: [],
    status: 'active',
    ...overrides
  }
}

/**
 * Create a mock file change for testing
 */
export function createMockFileChange(overrides: Partial<FileChange> = {}): FileChange {
  return {
    path: '/test/file.ts',
    type: 'modified',
    timestamp: new Date(),
    ...overrides
  }
}

/**
 * Create a mock analysis result for testing
 */
export function createMockAnalysisResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    qualityScore: 85,
    issues: [],
    metrics: {
      complexity: 5,
      duplication: 0,
      coverage: 90
    },
    suggestions: [],
    ...overrides
  }
}

/**
 * Create a mock detected issue for testing
 */
export function createMockDetectedIssue(overrides: Partial<DetectedIssue> = {}): DetectedIssue {
  return {
    type: 'complexity',
    severity: 'medium',
    message: 'Function has high complexity',
    file: '/test/file.ts',
    line: 10,
    suggestion: 'Consider breaking this function into smaller parts',
    ...overrides
  }
}

/**
 * Create multiple mock file changes
 */
export function createMockFileChanges(count: number): FileChange[] {
  return Array.from({ length: count }, (_, i) => 
    createMockFileChange({
      path: `/test/file${i}.ts`,
      timestamp: new Date(Date.now() + i * 1000)
    })
  )
}
