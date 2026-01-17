import { unlink } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export async function logoutCommand(): Promise<void> {
  try {
    const configPath = join(homedir(), '.trak', 'config.json');
    await unlink(configPath);
    
    console.log('✅ Successfully logged out');
    console.log('💡 Your sessions will no longer be reported to organization dashboard');
    
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('ℹ️  You are not currently logged in');
    } else {
      console.error('❌ Logout failed:', error.message);
      process.exit(1);
    }
  }
}
