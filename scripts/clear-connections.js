#!/usr/bin/env node

/**
 * Clear MySQL Connections Script
 * Manually clears existing MySQL connections when hitting connection limits
 * Usage: node scripts/clear-connections.js
 */

const { killExistingConnections } = require('../utils/connection-reset');

console.log('🧹 MySQL Connection Cleanup Tool');
console.log('================================');

killExistingConnections()
  .then((success) => {
    if (success) {
      console.log('✅ Connection cleanup completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Connection cleanup failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  });
