#!/usr/bin/env node

// Example demonstrating the improved error handling
import { createSessionManager } from '../src/services/sessionManager.js';
import { TrakError, ErrorCode } from '../src/services/errorHandler.js';

async function demonstrateErrorHandling() {
  console.log('🔍 Testing improved error handling...\n');
  
  // Test with non-existent directory
  const sessionManager = createSessionManager('/non/existent/path');
  
  try {
    const session = sessionManager.getSession();
    console.log('Session loaded:', session ? 'Success' : 'No session found');
  } catch (error) {
    if (error instanceof TrakError) {
      console.log(`✅ Caught TrakError: [${error.code}] ${error.message}`);
    }
  }
  
  console.log('\n✨ Error handling improvements:');
  console.log('• Typed error codes for better handling');
  console.log('• Consistent error logging format');
  console.log('• Proper error context and cause tracking');
  console.log('• No more silent failures');
}

demonstrateErrorHandling();
