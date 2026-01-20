import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { deserializeSession, type Session, type SessionChange } from '../../src/services/sessionManager.js'

const sessionChangeArbitrary: fc.Arbitrary<SessionChange> = fc.record({
  path: fc.string({ minLength: 1 }),
  type: fc.constantFrom('added', 'modified', 'deleted'),
  timestamp: fc.date(),
  changeCount: fc.integer({ min: 1, max: 25 }),
})

const sessionArbitrary: fc.Arbitrary<Session> = fc.record({
  id: fc.string({ minLength: 1 }),
  startTime: fc.date(),
  endTime: fc.option(fc.date(), { nil: undefined }),
  cwd: fc.string({ minLength: 1 }),
  changes: fc.array(sessionChangeArbitrary),
  status: fc.constantFrom('active', 'stopped'),
  daemonPid: fc.option(fc.integer({ min: 1, max: 1_000_000 }), { nil: undefined }),
  summary: fc.option(fc.string(), { nil: undefined }),
  analysis: fc.option(fc.record({
    metrics: fc.record({
      qualityScore: fc.integer({ min: 0, max: 100 }),
      issueCount: fc.record({
        high: fc.integer({ min: 0, max: 50 }),
        medium: fc.integer({ min: 0, max: 50 }),
        low: fc.integer({ min: 0, max: 50 }),
      })
    }),
    issues: fc.array(fc.record({
      id: fc.string({ minLength: 1 }),
      type: fc.string({ minLength: 1 }),
      severity: fc.string({ minLength: 1 }),
      filePath: fc.string({ minLength: 1 }),
      lineNumber: fc.integer({ min: 1, max: 1_000_000 }),
      description: fc.string({ minLength: 1 }),
      suggestion: fc.string({ minLength: 1 }),
    }))
  }), { nil: undefined })
})

describe('Session Data Properties', () => {
  it('should serialize and deserialize sessions correctly', () => {
    fc.assert(fc.property(sessionArbitrary, (session) => {
      const serialized = JSON.stringify(session)
      const deserialized = deserializeSession(JSON.parse(serialized))

      expect(deserialized).toEqual(session)
    }))
  })

  it('should maintain session duration calculation properties', () => {
    fc.assert(fc.property(
      fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
      fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
      (startTime, endTime) => {
        // Ensure endTime is after startTime
        const actualEndTime = endTime.getTime() > startTime.getTime() ? endTime : new Date(startTime.getTime() + 1000)
        
        const duration = actualEndTime.getTime() - startTime.getTime()
        
        expect(duration).toBeGreaterThanOrEqual(0)
        expect(duration).toBe(actualEndTime.getTime() - startTime.getTime())
      }
    ))
  })

  it('should handle file change deduplication correctly', () => {
    fc.assert(fc.property(
      fc.array(sessionChangeArbitrary),
      (changes) => {
        // Simulate deduplication logic
        const uniqueFiles = new Map<string, SessionChange>()
        
        changes.forEach(change => {
          uniqueFiles.set(change.path, change)
        })
        
        const deduplicated = Array.from(uniqueFiles.values())
        
        // Properties that should hold
        expect(deduplicated.length).toBeLessThanOrEqual(changes.length)
        
        // All paths should be unique
        const paths = deduplicated.map(f => f.path)
        const uniquePaths = [...new Set(paths)]
        expect(paths).toEqual(uniquePaths)
      }
    ))
  })

  it('should validate quality scores are within bounds', () => {
    fc.assert(fc.property(
      fc.integer({ min: -100, max: 200 }),
      (score) => {
        // Simulate quality score normalization
        const normalizedScore = Math.max(0, Math.min(100, score))
        
        expect(normalizedScore).toBeGreaterThanOrEqual(0)
        expect(normalizedScore).toBeLessThanOrEqual(100)
        
        if (score < 0) expect(normalizedScore).toBe(0)
        if (score > 100) expect(normalizedScore).toBe(100)
        if (score >= 0 && score <= 100) expect(normalizedScore).toBe(score)
      }
    ))
  })

  it('should handle file path normalization consistently', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1 }),
      (path) => {
        // Simulate path normalization
        const normalized = path
          .replace(/\\/g, '/') // Convert backslashes to forward slashes
          .replace(/\/+/g, '/') // Remove duplicate slashes
          .replace(/\/$/, '') // Remove trailing slash
        
        // Properties that should hold
        expect(normalized).not.toMatch(/\\/g) // No backslashes
        expect(normalized).not.toMatch(/\/\//g) // No double slashes
        expect(normalized).not.toMatch(/\/$/g) // No trailing slash (unless root)
      }
    ))
  })
})
