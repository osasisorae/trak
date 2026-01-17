import { EventEmitter } from 'events';
import chokidar, { FSWatcher } from 'chokidar';

/**
 * Represents a file system change event
 */
export interface FileChange {
  /** Type of change: file added, modified, or deleted */
  type: 'add' | 'change' | 'unlink';
  /** Relative path to the changed file */
  path: string;
  /** When the change occurred */
  timestamp: Date;
}

/**
 * Configuration options for the FileWatcher
 */
export interface FileWatcherConfig {
  /** Glob patterns for files to watch */
  patterns: string[];
  /** Glob patterns for files/directories to exclude */
  excludePatterns: string[];
  /** Milliseconds to wait before emitting change events */
  debounceMs: number;
  /** Working directory to watch from */
  cwd: string;
}

/**
 * Watches file system changes and emits events for tracked files
 */
export class FileWatcher extends EventEmitter {
  private watcher?: FSWatcher;
  private config: FileWatcherConfig;
  private extensions: Set<string>;

  constructor(config: FileWatcherConfig) {
    super();
    this.config = config;
    // Extract file extensions from patterns for efficient filtering
    this.extensions = this.extractExtensions(config.patterns);
  }

  private extractExtensions(patterns: string[]): Set<string> {
    const exts = new Set<string>();
    for (const pattern of patterns) {
      const match = pattern.match(/\*\.(\w+)$/);
      if (match) exts.add(`.${match[1]}`);
    }
    return exts;
  }

  private shouldInclude(path: string): boolean {
    if (this.extensions.size === 0) return true;
    return Array.from(this.extensions).some(ext => path.endsWith(ext));
  }

  start() {
    this.watcher = chokidar.watch(this.config.cwd, {
      ignored: this.config.excludePatterns,
      persistent: true,
      ignoreInitial: true,
      usePolling: true,
      awaitWriteFinish: {
        stabilityThreshold: this.config.debounceMs,
        pollInterval: 100
      },
      cwd: this.config.cwd
    });

    this.watcher
      .on('add', (path: string) => {
        if (this.shouldInclude(path)) {
          this.emit('change', { type: 'add', path, timestamp: new Date() });
        }
      })
      .on('change', (path: string) => {
        if (this.shouldInclude(path)) {
          this.emit('change', { type: 'change', path, timestamp: new Date() });
        }
      })
      .on('unlink', (path: string) => {
        if (this.shouldInclude(path)) {
          this.emit('change', { type: 'unlink', path, timestamp: new Date() });
        }
      });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }
  }

  onFileChange(callback: (change: FileChange) => void) {
    this.on('change', callback);
  }
}

export function createFileWatcher(overrides?: Partial<FileWatcherConfig>): FileWatcher {
  const config: FileWatcherConfig = {
    patterns: ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx', '**/*.py', '**/*.go', '**/*.rs', '**/*.md'],
    excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**', '**/*.test.*'],
    debounceMs: 300,
    cwd: process.cwd(),
    ...overrides
  };
  return new FileWatcher(config);
}
