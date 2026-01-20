#!/usr/bin/env node
import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { createFileWatcher } from './fileWatcher.js';
import { createSessionManager } from './sessionManager.js';

config();

async function runDaemon() {
  const logPath = join(process.cwd(), '.trak', 'daemon.log');
  const log = (message: string) => {
    const timestamp = new Date().toISOString();
    writeFileSync(logPath, `[${timestamp}] ${message}\n`, { flag: 'a' });
  };

  log('Daemon started');
  log(`CWD: ${process.cwd()}`);

  const sessionManager = createSessionManager();
  const watcher = createFileWatcher();

  log('File watcher created');

  watcher.on('ready', () => {
    log('File watcher is ready and watching');
  });

  watcher.on('error', (error: unknown) => {
    log(`File watcher error: ${error}`);
  });

  watcher.onFileChange((change) => {
    log(`File change detected: ${change.type} ${change.path}`);
    sessionManager.addChange(change);
  });

  await watcher.start();
  log('File watcher started');

  const shutdown = (signal: string) => {
    log(`Received ${signal}, shutting down`);
    watcher.stop().finally(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  await new Promise(() => {});
}

runDaemon().catch((error) => {
  console.error('Daemon error:', error);
  process.exit(1);
});
