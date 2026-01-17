#!/usr/bin/env node

import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Testing readline...');

const name = await new Promise((resolve) => {
  rl.question('Enter your name: ', resolve);
});

console.log(`Got name: ${name}`);

const email = await new Promise((resolve) => {
  rl.question('Enter your email: ', resolve);
});

console.log(`Got email: ${email}`);

rl.close();
console.log('Done!');
