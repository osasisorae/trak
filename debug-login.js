#!/usr/bin/env node

// Test script to debug readline issues
import { createInterface } from 'readline';

async function testLogin() {
  console.log('Starting login test...');
  
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log('About to ask for name...');
    const name = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for name'));
      }, 5000);
      
      rl.question('Enter your name: ', (answer) => {
        clearTimeout(timeout);
        resolve(answer);
      });
    });
    
    console.log(`Got name: "${name}"`);
    
    console.log('About to ask for email...');
    const email = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for email'));
      }, 5000);
      
      rl.question('Enter your email: ', (answer) => {
        clearTimeout(timeout);
        resolve(answer);
      });
    });
    
    console.log(`Got email: "${email}"`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
    console.log('Readline closed');
  }
}

testLogin().catch(console.error);
