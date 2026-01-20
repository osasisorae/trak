import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createTempDir, cleanupTempDir, wait } from '../helpers/test-utils.js'
import { createFileWatcher } from '../../src/services/fileWatcher.js'

describe('FileWatcher Integration', () => {
  let tempDir: string
  let fileWatcher: ReturnType<typeof createFileWatcher>

  beforeEach(async () => {
    tempDir = await createTempDir()
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
    await cleanupTempDir(tempDir)
  })

  it('should detect file creation', async () => {
    const changes: any[] = []
    fileWatcher.on('change', (change) => changes.push(change))

    await fileWatcher.start(tempDir)
    
    // Wait a bit for watcher to be ready
    await wait(50)
    
    // Create a new file
    const testFile = join(tempDir, 'test.ts')
    await writeFile(testFile, 'console.log("test")')
    
    // Wait longer for file system events to propagate
    await wait(500)
    
    expect(changes.length).toBeGreaterThan(0)
    expect(changes[0]).toMatchObject({
      type: 'added',
      path: 'test.ts'
    })
  })

  it('should detect file modification', async () => {
    const changes: any[] = []
    
    // Create initial file
    const testFile = join(tempDir, 'test.ts')
    await writeFile(testFile, 'console.log("initial")')
    
    fileWatcher.on('change', (change) => changes.push(change))
    await fileWatcher.start(tempDir)
    
    // Wait for watcher to be ready
    await wait(50)
    
    // Modify the file
    await writeFile(testFile, 'console.log("modified")')
    await wait(500)
    
    expect(changes.length).toBeGreaterThan(0)
    expect(changes[0]).toMatchObject({
      type: 'modified',
      path: 'test.ts'
    })
  })

  it('should ignore files matching ignore patterns', async () => {
    const changes: any[] = []
    fileWatcher.on('change', (change) => changes.push(change))

    await fileWatcher.start(tempDir)
    
    // Create ignored directory and file
    const nodeModulesDir = join(tempDir, 'node_modules')
    await mkdir(nodeModulesDir)
    await writeFile(join(nodeModulesDir, 'package.js'), 'module.exports = {}')
    
    await wait(100)
    
    expect(changes).toHaveLength(0)
  })

  it('should handle multiple rapid changes with debouncing', async () => {
    const changes: any[] = []
    fileWatcher.on('change', (change) => changes.push(change))

    await fileWatcher.start(tempDir)
    
    const testFile = join(tempDir, 'test.ts')
    
    // Make multiple rapid changes
    await writeFile(testFile, 'version 1')
    await writeFile(testFile, 'version 2')
    await writeFile(testFile, 'version 3')
    
    // Wait for debouncing/awaitWriteFinish to settle
    await wait(300)
    
    // Should only get one change event due to debouncing
    expect(changes.length).toBeLessThanOrEqual(2)
  })
})
