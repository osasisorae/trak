import { createSessionManager } from '../services/sessionManager.js';

export async function statusCommand() {
  const sessionManager = createSessionManager();
  const session = sessionManager.getSession();

  if (!session || session.status !== 'active') {
    console.log('No active session. Run "trak start" to begin tracking.');
    return;
  }

  const start = new Date(session.startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  const duration = hours > 0 
    ? `${hours}h ${minutes}m ${seconds}s`
    : minutes > 0 
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`;

  const relativeTime = hours > 0
    ? `${hours} hour${hours > 1 ? 's' : ''} ago`
    : minutes > 0
      ? `${minutes} minute${minutes > 1 ? 's' : ''} ago`
      : 'just now';

  const added = session.changes.filter(c => c.type === 'add').length;
  const modified = session.changes.filter(c => c.type === 'change').length;
  const deleted = session.changes.filter(c => c.type === 'unlink').length;

  console.log('📍 Active Session');
  console.log('─────────────────────');
  console.log(`ID: ${session.id}`);
  console.log(`Started: ${relativeTime}`);
  console.log(`Duration: ${duration}`);
  console.log('');
  console.log(`Files tracked: ${session.changes.length}`);
  if (added > 0) console.log(`  ➕ ${added} added`);
  if (modified > 0) console.log(`  📝 ${modified} modified`);
  if (deleted > 0) console.log(`  🗑️ ${deleted} deleted`);

  if (session.changes.length > 0) {
    console.log('');
    console.log('Recent changes:');
    const recent = session.changes
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
    
    for (const change of recent) {
      const icon = change.type === 'add' ? '➕' : change.type === 'unlink' ? '🗑️' : '📝';
      console.log(`  ${icon} ${change.path}`);
    }
  }
  
  console.log('─────────────────────');
}
