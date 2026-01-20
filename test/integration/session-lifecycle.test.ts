import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createTempDir, cleanupTempDir, wait, mockEnv, restoreEnv } from '../helpers/test-utils.js'
import { createSessionManager } from '../../src/services/sessionManager.js'
import { createFileWatcher } from '../../src/services/fileWatcher.js'

describe('Session Lifecycle Integration', () => {
  let tempDir: string
  let sessionManager: ReturnType<typeof createSessionManager>
  let fileWatcher: ReturnType<typeof createFileWatcher>

  beforeEach(async () => {
    tempDir = await createTempDir()
    
    // Mock environment for testing
    mockEnv({
      OPENAI_API_KEY: 'test-key-123'
    })

    sessionManager = createSessionManager(tempDir)
    fileWatcher = createFileWatcher({
      patterns: ['**/*.ts', '**/*.js'],
      ignored: ['node_modules/**', '.git/**'],
      debounceMs: 50
    })
  })

  afterEach(async () => {
    if (fileWatcher) {
      await fileWatcher.stop()
    }
    restoreEnv()
    await cleanupTempDir(tempDir)
  })

  it('should complete full session lifecycle', async () => {
    // 1. Start session
    const session = sessionManager.startSession()
    expect(session).toBeDefined()
    expect(session.startTime).toBeInstanceOf(Date)
    expect(session.endTime).toBeUndefined()
    expect(sessionManager.isSessionActive()).toBe(true)

    // 2. Start file watching
    fileWatcher.on('change', (change) => {
      sessionManager.addChange(change)
    })
    await fileWatcher.start(tempDir)

    // 3. Make file changes
    const testFile = join(tempDir, 'test.ts')
    await writeFile(testFile, 'console.log("test")')
    await wait(200)

    const testFile2 = join(tempDir, 'utils.ts')
    await writeFile(testFile2, 'export function helper() {}')
    await wait(200)

    // 4. Check session has tracked changes
    const currentSession = sessionManager.getSession()
    expect(currentSession?.changes.length).toBeGreaterThan(0)

    // 5. Stop session
    const stoppedSession = sessionManager.stopSession()
    expect(stoppedSession).toBeDefined()
    expect(stoppedSession?.endTime).toBeInstanceOf(Date)
    expect(stoppedSession?.changes.length).toBeGreaterThan(0)
    expect(sessionManager.isSessionActive()).toBe(false)
  })

  it('should handle session recovery after restart', () => {
    // Start a session
    const originalSession = sessionManager.startSession()
    
    // Add some file changes
    sessionManager.addChange({
      path: 'test.ts',
      type: 'added',
      timestamp: new Date()
    })

    // Create new session manager (simulating restart)
    const newSessionManager = createSessionManager(tempDir)
    
    // Should recover the active session
    expect(newSessionManager.isSessionActive()).toBe(true)
    const recoveredSession = newSessionManager.getSession()
    expect(recoveredSession?.id).toBe(originalSession.id)
    expect(recoveredSession?.changes.length).toBe(1)
  })

  it('should allow another process to append changes', () => {
    // Start a session in one "process"
    const originalSession = sessionManager.startSession()
    expect(sessionManager.isSessionActive()).toBe(true)

    // Append changes from another SessionManager instance (like the daemon)
    const otherProcessSessionManager = createSessionManager(tempDir)
    otherProcessSessionManager.addChange({
      path: 'daemon-added.ts',
      type: 'added',
      timestamp: new Date()
    })

    // Read from a fresh SessionManager to simulate another process (CLI/status/etc.)
    const recoveredSession = createSessionManager(tempDir).getSession()
    expect(recoveredSession?.id).toBe(originalSession.id)
    expect(recoveredSession?.changes.length).toBe(1)
  })

  it('should allow multiple sessions (replaces previous)', async () => {
    // Start first session
    const session1 = sessionManager.startSession()
    expect(sessionManager.isSessionActive()).toBe(true)

    // Wait a bit to ensure different timestamps
    await wait(10)

    // Start another session (should replace the first)
    const session2 = sessionManager.startSession()
    expect(session2.id).not.toBe(session1.id)
    expect(sessionManager.isSessionActive()).toBe(true)
  })

  it('should handle stopping non-existent session gracefully', () => {
    expect(sessionManager.isSessionActive()).toBe(false)
    
    const result = sessionManager.stopSession()
    expect(result).toBeNull()
  })
})
