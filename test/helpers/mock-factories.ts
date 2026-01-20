import type { Session } from '../../src/services/sessionManager.js'
import type { FileChange } from '../../src/services/fileWatcher.js'
import type { AnalysisResult, DetectedIssue } from '../../src/services/codeAnalyzer.js'

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
    path: 'file.ts',
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
    issues: [],
    metrics: {
      qualityScore: 85,
      complexity: 5,
      duplication: 0,
      issueCount: { high: 0, medium: 0, low: 0 }
    },
    summary: 'Mock analysis summary',
    analysisTime: 0,
    ...overrides
  }
}

/**
 * Create a mock detected issue for testing
 */
export function createMockDetectedIssue(overrides: Partial<DetectedIssue> = {}): DetectedIssue {
  return {
    id: `issue-${Date.now()}`,
    type: 'complexity',
    severity: 'medium',
    filePath: 'file.ts',
    lineNumber: 10,
    description: 'Function has high complexity. This makes it harder to understand and test. It also increases the risk of subtle bugs when changing behavior.',
    suggestion: 'Consider breaking this function into smaller parts.',
    ...overrides
  }
}

/**
 * Create multiple mock file changes
 */
export function createMockFileChanges(count: number): FileChange[] {
  return Array.from({ length: count }, (_, i) => 
    createMockFileChange({
      path: `file${i}.ts`,
      timestamp: new Date(Date.now() + i * 1000)
    })
  )
}
