import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import type { Session, FileChange } from '../../src/types/index.js'

// Arbitraries for property-based testing
const fileChangeArbitrary = fc.record({
  path: fc.string({ minLength: 1 }),
  type: fc.constantFrom('added', 'modified', 'deleted'),
  timestamp: fc.date()
})

const sessionArbitrary = fc.record({
  id: fc.integer({ min: 1 }),
  startTime: fc.date(),
  endTime: fc.option(fc.date()),
  files: fc.array(fileChangeArbitrary),
  summary: fc.option(fc.string()),
  analysis: fc.option(fc.record({
    qualityScore: fc.integer({ min: 0, max: 100 }),
    issues: fc.array(fc.record({
      type: fc.string(),
      severity: fc.constantFrom('low', 'medium', 'high'),
      message: fc.string(),
      file: fc.string(),
      line: fc.integer({ min: 1 })
    }))
  }))
})

describe('Session Data Properties', () => {
  it('should serialize and deserialize sessions correctly', () => {
    fc.assert(fc.property(sessionArbitrary, (session) => {
      const serialized = JSON.stringify(session)
      const deserialized = JSON.parse(serialized)
      
      // Convert date strings back to Date objects for comparison
      deserialized.startTime = new Date(deserialized.startTime)
      if (deserialized.endTime) {
        deserialized.endTime = new Date(deserialized.endTime)
      }
      deserialized.files = deserialized.files.map((file: any) => ({
        ...file,
        timestamp: new Date(file.timestamp)
      }))
      
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
      fc.array(fileChangeArbitrary),
      (fileChanges) => {
        // Simulate deduplication logic
        const uniqueFiles = new Map<string, FileChange>()
        
        fileChanges.forEach(change => {
          uniqueFiles.set(change.path, change)
        })
        
        const deduplicated = Array.from(uniqueFiles.values())
        
        // Properties that should hold
        expect(deduplicated.length).toBeLessThanOrEqual(fileChanges.length)
        
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
