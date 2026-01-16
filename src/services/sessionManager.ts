import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { FileChange } from './fileWatcher.js';

export interface SessionChange {
  path: string;
  type: 'add' | 'change' | 'unlink';
  timestamp: Date;
  changeCount: number;
}

export interface Session {
  id: string;
  startTime: Date;
  endTime?: Date;
  cwd: string;
  changes: SessionChange[];
  status: 'active' | 'stopped';
}

export class SessionManager {
  private session: Session | null = null;
  private trakDir: string;
  private currentSessionPath: string;
  private sessionsDir: string;

  constructor(cwd: string = process.cwd()) {
    this.trakDir = join(cwd, '.trak');
    this.currentSessionPath = join(this.trakDir, 'current-session.json');
    this.sessionsDir = join(this.trakDir, 'sessions');
  }

  private ensureDirectories() {
    if (!existsSync(this.trakDir)) {
      mkdirSync(this.trakDir, { recursive: true });
    }
    if (!existsSync(this.sessionsDir)) {
      mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  startSession(): Session {
    this.ensureDirectories();
    
    this.session = {
      id: Date.now().toString(),
      startTime: new Date(),
      cwd: process.cwd(),
      changes: [],
      status: 'active'
    };

    this.persist();
    return this.session;
  }

  stopSession(): Session | null {
    if (!this.session) return null;

    this.session.endTime = new Date();
    this.session.status = 'stopped';

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const archivePath = join(this.sessionsDir, `${timestamp}-session.json`);
    
    writeFileSync(archivePath, JSON.stringify(this.session, null, 2));
    
    if (existsSync(this.currentSessionPath)) {
      writeFileSync(this.currentSessionPath, '');
    }

    const stoppedSession = this.session;
    this.session = null;
    return stoppedSession;
  }

  getSession(): Session | null {
    if (this.session) return this.session;

    if (existsSync(this.currentSessionPath)) {
      try {
        const data = readFileSync(this.currentSessionPath, 'utf-8');
        if (data.trim()) {
          this.session = JSON.parse(data);
          return this.session;
        }
      } catch {}
    }

    return null;
  }

  isSessionActive(): boolean {
    return this.getSession()?.status === 'active';
  }

  addChange(change: FileChange) {
    if (!this.session || this.session.status !== 'active') return;

    const existing = this.session.changes.find(c => c.path === change.path);
    
    if (existing) {
      existing.changeCount++;
      existing.timestamp = change.timestamp;
      existing.type = change.type;
    } else {
      this.session.changes.push({
        path: change.path,
        type: change.type,
        timestamp: change.timestamp,
        changeCount: 1
      });
    }

    this.persist();
  }

  private persist() {
    if (this.session) {
      writeFileSync(this.currentSessionPath, JSON.stringify(this.session, null, 2));
    }
  }
}

export function createSessionManager(cwd?: string): SessionManager {
  return new SessionManager(cwd);
}
