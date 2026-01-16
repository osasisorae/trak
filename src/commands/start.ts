import { createFileWatcher } from '../services/fileWatcher.js';
import { createSessionManager } from '../services/sessionManager.js';

export async function startCommand() {
  const sessionManager = createSessionManager();
  
  if (sessionManager.isSessionActive()) {
    console.log('❌ Session already active. Run "trak stop" first.');
    process.exit(1);
  }

  const session = sessionManager.startSession();
  const watcher = createFileWatcher();

  watcher.onFileChange((change) => {
    sessionManager.addChange(change);
    
    const icon = change.type === 'add' ? '➕' : change.type === 'unlink' ? '🗑️' : '📝';
    const action = change.type === 'add' ? 'added' : change.type === 'unlink' ? 'deleted' : 'modified';
    console.log(`${icon} ${change.path} (${action})`);
    
    const currentSession = sessionManager.getSession();
    if (currentSession) {
      console.log(`   📊 ${currentSession.changes.length} files tracked`);
    }
  });

  watcher.start();

  console.log('🟢 Session started. Tracking changes...');
  console.log('   Press Ctrl+C or run \'trak stop\' to end session');

  process.on('SIGINT', () => {
    watcher.stop();
    console.log('\nSession paused. Run \'trak stop\' to generate summary.');
    process.exit(0);
  });

  await new Promise(() => {});
}
