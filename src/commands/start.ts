import { createFileWatcher } from '../services/fileWatcher.js';
import { createSessionManager } from '../services/sessionManager.js';

/**
 * Starts a new coding session and begins tracking file changes.
 * Prevents multiple active sessions and provides real-time feedback.
 */
export async function startCommand() {
  const sessionManager = createSessionManager();
  
  // Prevent multiple active sessions
  if (sessionManager.isSessionActive()) {
    console.log('❌ Session already active. Run "trak stop" first.');
    process.exit(1);
  }

  // Initialize session and file watcher
  const session = sessionManager.startSession();
  const watcher = createFileWatcher();

  // Set up file change handler with visual feedback
  watcher.onFileChange((change) => {
    sessionManager.addChange(change);
    
    // Display change with appropriate icon
    const icon = change.type === 'add' ? '➕' : change.type === 'unlink' ? '🗑️' : '📝';
    const action = change.type === 'add' ? 'added' : change.type === 'unlink' ? 'deleted' : 'modified';
    console.log(`${icon} ${change.path} (${action})`);
    
    // Show running count of tracked files
    const currentSession = sessionManager.getSession();
    if (currentSession) {
      console.log(`   📊 ${currentSession.changes.length} files tracked`);
    }
  });

  watcher.start();

  console.log('🟢 Session started. Tracking changes...');
  console.log('   Press Ctrl+C or run \'trak stop\' to end session');

  // Handle graceful shutdown on Ctrl+C
  process.on('SIGINT', () => {
    watcher.stop();
    console.log('\nSession paused. Run \'trak stop\' to generate summary.');
    process.exit(0);
  });

  // Keep the process running indefinitely
  await new Promise(() => {});
}
