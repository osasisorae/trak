import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createSessionManager } from '../services/sessionManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Starts a new coding session and begins tracking file changes in the background.
 * Spawns a detached daemon process to monitor file changes.
 */
export async function startCommand() {
  const sessionManager = createSessionManager();
  
  // Prevent multiple active sessions
  if (sessionManager.isSessionActive()) {
    console.log('❌ Session already active. Run "trak stop" first.');
    process.exit(1);
  }

  // Initialize session
  sessionManager.startSession();

  // Spawn detached daemon process
  const daemonScript = join(__dirname, '../services/daemon.js');
  const daemon = spawn('node', [daemonScript], {
    detached: true,
    stdio: 'ignore',
    cwd: process.cwd()
  });

  // Store daemon PID in session
  sessionManager.setDaemonPid(daemon.pid!);
  
  daemon.unref(); // Allow parent to exit

  console.log('🟢 Session started in background (PID: ' + daemon.pid + ')');
  console.log('   Run \'trak status\' to check progress');
  console.log('   Run \'trak stop\' to end session and generate summary');
}
