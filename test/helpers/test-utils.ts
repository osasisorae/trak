import { vi } from 'vitest'
import { mkdtemp, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

/**
 * Create a temporary directory for testing
 */
export async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'trak-test-'))
}

/**
 * Clean up temporary directory
 */
export async function cleanupTempDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true })
}

/**
 * Mock environment variables
 */
export function mockEnv(vars: Record<string, string>) {
  Object.entries(vars).forEach(([key, value]) => {
    vi.stubEnv(key, value)
  })
}

/**
 * Restore environment variables
 */
export function restoreEnv() {
  vi.unstubAllEnvs()
}

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create a mock function with TypeScript support
 */
export function createMockFn<T extends (...args: any[]) => any>(): vi.MockedFunction<T> {
  return vi.fn() as vi.MockedFunction<T>
}
