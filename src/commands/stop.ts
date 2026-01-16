import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createSessionManager } from '../services/sessionManager.js';
import { createSummaryGenerator } from '../services/summaryGenerator.js';

export async function stopCommand() {
  const sessionManager = createSessionManager();
  
  if (!sessionManager.isSessionActive()) {
    console.log('❌ No active session. Run "trak start" first.');
    process.exit(1);
  }

  const session = sessionManager.getSession();
  if (!session) {
    console.log('❌ No active session found.');
    process.exit(1);
  }

  console.log('⏳ Generating summary...');

  const fileContents = new Map<string, string>();
  for (const change of session.changes) {
    if (change.type !== 'unlink') {
      const fullPath = join(session.cwd, change.path);
      if (existsSync(fullPath)) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          fileContents.set(change.path, content);
        } catch {}
      }
    }
  }

  const summaryGenerator = createSummaryGenerator();
  const summary = await summaryGenerator.generateSummary(session, fileContents);

  const stoppedSession = sessionManager.stopSession();
  
  if (stoppedSession) {
    const sessionWithSummary = { ...stoppedSession, summary };
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const sessionPath = join(session.cwd, '.trak', 'sessions', `${timestamp}-session.json`);
    writeFileSync(sessionPath, JSON.stringify(sessionWithSummary, null, 2));

    const start = new Date(session.startTime);
    const end = new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const added = session.changes.filter(c => c.type === 'add').length;
    const modified = session.changes.filter(c => c.type === 'change').length;
    const deleted = session.changes.filter(c => c.type === 'unlink').length;

    console.log('\n📊 Session Summary');
    console.log('─────────────────────');
    console.log(`Duration: ${duration}`);
    console.log(`Files: ${added} added, ${modified} modified, ${deleted} deleted`);
    console.log('');
    console.log(summary);
    console.log('─────────────────────');
    console.log(`✅ Session saved to .trak/sessions/${timestamp}-session.json`);
  }
}
