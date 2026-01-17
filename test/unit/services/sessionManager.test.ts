import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSessionManager } from '../../src/services/sessionManager.js'
import { createMockFileChange } from '../helpers/mock-factories.js'
import { createTempDir, cleanupTempDir } from '../helpers/test-utils.js'

// Mock fs/promises
vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  readFile: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn()
}))

describe('SessionManager Unit Tests', () => {
  let tempDir: string
  let sessionManager: ReturnType<typeof createSessionManager>

  beforeEach(async () => {
    tempDir = await createTempDir()
    sessionManager = createSessionManager(tempDir)
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await cleanupTempDir(tempDir)
  })

  describe('startSession', () => {
    it('should create a new session with correct properties', async () => {
      const session = sessionManager.startSession()
      
      expect(session).toMatchObject({
        id: expect.any(String),
        startTime: expect.any(Date),
        endTime: undefined,
        cwd: expect.any(String),
        changes: [],
        status: 'active'
      })
      expect(sessionManager.isSessionActive()).toBe(true)
    })

    it('should replace existing session when starting new one', () => {
      const session1 = sessionManager.startSession()
      const session2 = sessionManager.startSession()
      
      expect(session2.id).not.toBe(session1.id)
      expect(sessionManager.isSessionActive()).toBe(true)
    })
  })

  describe('stopSession', () => {
    it('should stop active session and set end time', () => {
      const startedSession = sessionManager.startSession()
      const stoppedSession = sessionManager.stopSession()
      
      expect(stoppedSession?.id).toBe(startedSession.id)
      expect(stoppedSession?.endTime).toBeInstanceOf(Date)
      expect(sessionManager.isSessionActive()).toBe(false)
    })

    it('should return null if no active session', () => {
      const result = sessionManager.stopSession()
      expect(result).toBeNull()
    })
  })

  describe('addChange', () => {
    it('should add file change to active session', () => {
      sessionManager.startSession()
      const fileChange = createMockFileChange()
      
      sessionManager.addChange(fileChange)
      
      const session = sessionManager.getSession()
      expect(session?.changes).toContain(fileChange)
    })

    it('should not add file change if no active session', () => {
      const fileChange = createMockFileChange()
      
      expect(() => sessionManager.addChange(fileChange)).not.toThrow()
      // Should silently ignore when no active session
    })
  })

  describe('getSession', () => {
    it('should return current session when active', () => {
      const startedSession = sessionManager.startSession()
      const currentSession = sessionManager.getSession()
      
      expect(currentSession).toEqual(startedSession)
    })

    it('should return null when no active session', () => {
      const currentSession = sessionManager.getSession()
      
      expect(currentSession).toBeNull()
    })
  })

  describe('isSessionActive', () => {
    it('should return true when session is active', () => {
      sessionManager.startSession()
      
      expect(sessionManager.isSessionActive()).toBe(true)
    })

    it('should return false when no session is active', () => {
      expect(sessionManager.isSessionActive()).toBe(false)
    })

    it('should return false after stopping session', () => {
      sessionManager.startSession()
      sessionManager.stopSession()
      
      expect(sessionManager.isSessionActive()).toBe(false)
    })
  })
})
