#!/usr/bin/env node
import { Command } from 'commander';
import { startCommand } from './commands/start.js';
import { stopCommand } from './commands/stop.js';
import { statusCommand } from './commands/status.js';
import { devCommand } from './commands/dev.js';

const program = new Command();

program
  .name('trak')
  .description('Track and summarize coding sessions with AI')
  .version('0.1.0');

program
  .command('start')
  .description('Start tracking a coding session')
  .action(startCommand);

program
  .command('stop')
  .description('Stop tracking and generate AI summary')
  .action(stopCommand);

program
  .command('status')
  .description('Show current session status')
  .action(statusCommand);

program
  .command('dev')
  .description('Launch developer dashboard')
  .action(devCommand);

program.parse();
