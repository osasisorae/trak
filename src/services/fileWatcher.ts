import { EventEmitter } from 'events';
import chokidar, { FSWatcher } from 'chokidar';

/**
 * Represents a file system change event
 */
export interface FileChange {
  /** Type of change: file added, modified, or deleted */
  type: 'added' | 'modified' | 'deleted';
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
  /** Glob patterns for files/directories to exclude (chokidar's `ignored`) */
  ignored: string[];
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

  async start(cwd?: string): Promise<void> {
    const effectiveCwd = cwd ?? this.config.cwd;

    // Watch the whole working directory for reliability, then filter in-process.
    // (Glob + cwd mode can be flaky across platforms/environments.)
    this.watcher = chokidar.watch('.', {
      ignored: this.config.ignored,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: this.config.debounceMs,
        pollInterval: 100
      },
      cwd: effectiveCwd
    });

    this.watcher
      .on('ready', () => {
        this.emit('ready');
      })
      .on('add', (path: string) => {
        if (this.shouldInclude(path)) {
          this.emit('change', { type: 'added', path, timestamp: new Date() });
        }
      })
      .on('change', (path: string) => {
        if (this.shouldInclude(path)) {
          this.emit('change', { type: 'modified', path, timestamp: new Date() });
        }
      })
      .on('unlink', (path: string) => {
        if (this.shouldInclude(path)) {
          this.emit('change', { type: 'deleted', path, timestamp: new Date() });
        }
      })
      .on('error', (error: unknown) => {
        this.emit('error', error);
      });

    await new Promise<void>((resolve, reject) => {
      if (!this.watcher) return resolve();
      this.watcher.once('ready', resolve);
      this.watcher.once('error', reject);
    });
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
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
    ignored: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**', '**/.trak/**', '**/*.test.*'],
    debounceMs: 300,
    cwd: process.cwd(),
    ...overrides
  };
  return new FileWatcher(config);
}
