import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { chmod } from 'fs/promises';
import { createInterface } from 'readline';

interface TrakConfig {
  orgToken: string;
  orgEndpoint: string;
  developerId: string;
  developerName: string;
  lastLogin: string;
}

export async function loginCommand(orgToken: string): Promise<void> {
  try {
    // Validate token
    if (!orgToken || orgToken.trim().length < 8) {
      console.error('❌ Invalid organization token. Token must be at least 8 characters.');
      process.exit(1);
    }

    // Prompt for developer info
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const developerName = await new Promise<string>((resolve) => {
      rl.question('Enter your name: ', resolve);
    });

    const developerId = await new Promise<string>((resolve) => {
      rl.question('Enter your developer ID (email or username): ', resolve);
    });

    rl.close();

    if (!developerName.trim() || !developerId.trim()) {
      console.error('❌ Developer name and ID are required.');
      process.exit(1);
    }

    // Ensure ~/.trak directory exists
    const trakDir = join(homedir(), '.trak');
    await mkdir(trakDir, { recursive: true });

    // Create config
    const config: TrakConfig = {
      orgToken: orgToken.trim(),
      orgEndpoint: process.env.TRAK_ORG_ENDPOINT || 'https://api.trak.dev/report',
      developerId: developerId.trim(),
      developerName: developerName.trim(),
      lastLogin: new Date().toISOString()
    };

    // Save config with secure permissions
    const configPath = join(trakDir, 'config.json');
    await writeFile(configPath, JSON.stringify(config, null, 2));
    await chmod(configPath, 0o600); // Read/write for owner only

    console.log('✅ Successfully logged in to organization');
    console.log(`📋 Developer: ${config.developerName} (${config.developerId})`);
    console.log(`🏢 Organization endpoint: ${config.orgEndpoint}`);
    console.log('💡 Your sessions will now be reported to your organization dashboard');

  } catch (error) {
    console.error('❌ Login failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

export async function getTrakConfig(): Promise<TrakConfig | null> {
  try {
    const configPath = join(homedir(), '.trak', 'config.json');
    const content = await readFile(configPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}
