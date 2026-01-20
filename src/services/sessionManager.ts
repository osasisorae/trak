import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { FileChange } from './fileWatcher.js';

/**
 * Represents a tracked file change within a session
 */
export interface SessionChange {
  /** Relative path to the changed file */
  path: string;
  /** Type of change: add, change, or unlink */
  type: 'add' | 'change' | 'unlink';
  /** When the change occurred */
  timestamp: Date;
  /** Number of times this file was modified in the session */
  changeCount: number;
}

/**
 * Represents a complete coding session with metadata and tracked changes
 */
export interface Session {
  /** Unique identifier for the session */
  id: string;
  /** When the session started */
  startTime: Date;
  /** When the session ended (undefined if still active) */
  endTime?: Date;
  /** Working directory where the session was tracked */
  cwd: string;
  /** All file changes that occurred during the session */
  changes: SessionChange[];
  /** Current status of the session */
  status: 'active' | 'stopped';
  /** AI-generated summary of the session */
  summary?: string;
  /** AI analysis results */
  analysis?: {
    metrics: {
      qualityScore: number;
      issueCount: {
        high: number;
        medium: number;
        low: number;
      };
    };
    issues: Array<{
      id: string;
      type: string;
      severity: string;
      filePath: string;
      lineNumber: number;
      description: string;
      suggestion: string;
    }>;
  };
}

/** Helper function to deserialize a session from JSON, converting date strings to Date objects */
export function deserializeSession(data: any): Session {
  return {
    ...data,
    startTime: new Date(data.startTime),
    endTime: data.endTime ? new Date(data.endTime) : undefined,
  };
}

/**
 * Manages coding session lifecycle and persistence.
 * Handles starting/stopping sessions and tracking file changes within them.
 */
export class SessionManager {
  private session: Session | null = null;
  private trakDir: string;
  private currentSessionPath: string;
  private sessionsDir: string;

  constructor(cwd: string = process.cwd()) {
    // Set up directory structure: .trak/current-session.json and .trak/sessions/
    this.trakDir = join(cwd, '.trak');
    this.currentSessionPath = join(this.trakDir, 'current-session.json');
    this.sessionsDir = join(this.trakDir, 'sessions');
  }

  /**
   * Ensures the .trak directory structure exists
   */
  private ensureDirectories() {
    if (!existsSync(this.trakDir)) {
      mkdirSync(this.trakDir, { recursive: true });
    }
    if (!existsSync(this.sessionsDir)) {
      mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  /**
   * Starts a new coding session
   * @returns The newly created session
   */
  startSession(): Session {
    this.ensureDirectories();
    
    this.session = {
      id: Date.now().toString(), // Simple timestamp-based ID
      startTime: new Date(),
      cwd: process.cwd(),
      changes: [],
      status: 'active'
    };

    this.persist();
    return this.session;
  }

  /**
   * Stops the current session and archives it
   * @returns The stopped session, or null if no active session
   */
  stopSession(): Session | null {
    if (!this.session) return null;

    this.session.endTime = new Date();
    this.session.status = 'stopped';

    // Create timestamped filename for the archived session
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const archivePath = join(this.sessionsDir, `${timestamp}-session.json`);
    
    // Save to archive and clear current session
    writeFileSync(archivePath, JSON.stringify(this.session, null, 2));
    
    if (existsSync(this.currentSessionPath)) {
      writeFileSync(this.currentSessionPath, '');
    }

    const stoppedSession = this.session;
    this.session = null;
    return stoppedSession;
  }

  /**
   * Gets the current session, loading from disk if needed
   * @returns The current session or null if none exists
   */
  getSession(): Session | null {
    if (this.session) return this.session;

    // Try to load from current-session.json
    if (existsSync(this.currentSessionPath)) {
      try {
        const data = readFileSync(this.currentSessionPath, 'utf-8');
        if (data.trim()) {
          const parsed = JSON.parse(data);
          this.session = deserializeSession(parsed);
          return this.session;
        }
      } catch {
        // Ignore parse errors - file might be corrupted
      }
    }

    return null;
  }

  /**
   * Checks if there's an active session
   */
  isSessionActive(): boolean {
    return this.getSession()?.status === 'active';
  }

  /**
   * Adds a file change to the current session
   * Updates existing changes or creates new ones as needed
   */
  addChange(change: FileChange) {
    if (!this.session || this.session.status !== 'active') return;

    // Check if we already have a change for this file
    const existing = this.session.changes.find(c => c.path === change.path);
    
    if (existing) {
      // Update existing change with new timestamp and increment count
      existing.changeCount++;
      existing.timestamp = change.timestamp;
      existing.type = change.type;
    } else {
      // Add new change
      this.session.changes.push({
        path: change.path,
        type: change.type,
        timestamp: change.timestamp,
        changeCount: 1
      });
    }

    this.persist();
  }

  /**
   * Saves the current session to disk
   */
  private persist() {
    if (this.session) {
      writeFileSync(this.currentSessionPath, JSON.stringify(this.session, null, 2));
    }
  }
}

/**
 * Creates a SessionManager instance for the specified directory
 * @param cwd Working directory to track sessions in (defaults to current directory)
 */
export function createSessionManager(cwd?: string): SessionManager {
  return new SessionManager(cwd);
}
