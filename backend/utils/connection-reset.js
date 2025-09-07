const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Connection Reset Utility
 * Helps clear existing MySQL connections when hitting connection limits
 */

/**
 * Kill all existing connections for the current user
 * This helps when hitting the max_user_connections limit
 */
const killExistingConnections = async () => {
  let tempConnection;
  try {
    // Create a temporary connection to kill other connections
    tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
      user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
      database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
      connectTimeout: 60000, // 60 seconds for free hosting
      keepAliveInitialDelay: 0,
      enableKeepAlive: true
    });

    console.log('🔍 Checking for existing connections...');
    
    // Get current connection ID
    const [currentConn] = await tempConnection.execute('SELECT CONNECTION_ID() as id');
    const currentId = currentConn[0].id;
    
    // Get all connections for this user
    const [connections] = await tempConnection.execute(`
      SELECT ID, USER, HOST, DB, COMMAND, TIME, STATE 
      FROM information_schema.PROCESSLIST 
      WHERE USER = ? AND ID != ?
    `, [process.env.DB_USER || process.env.DATABASE_USER || 'root', currentId]);
    
    console.log(`📊 Found ${connections.length} existing connections for user`);
    
    if (connections.length > 0) {
      console.log('🧹 Cleaning up existing connections...');
      
      // Kill each connection (except current one)
      for (const conn of connections) {
        try {
          await tempConnection.execute(`KILL CONNECTION ${conn.ID}`);
          console.log(`✅ Killed connection ${conn.ID} (${conn.TIME}s old)`);
        } catch (error) {
          // Connection might already be dead, ignore
          console.log(`⚠️ Could not kill connection ${conn.ID}: ${error.message}`);
        }
      }
      
      console.log('✅ Connection cleanup completed');
    } else {
      console.log('✅ No existing connections to clean up');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error during connection cleanup:', error.message);
    return false;
  } finally {
    // Always close the temporary connection
    if (tempConnection) {
      try {
        await tempConnection.end();
      } catch (error) {
        console.log('⚠️ Error closing temp connection:', error.message);
      }
    }
  }
};

/**
 * Wait for connections to be available
 * Implements exponential backoff and waits for natural connection timeout
 */
const waitForConnectionAvailability = async (maxAttempts = 10, baseDelay = 3000) => {
  console.log('⏳ Waiting for MySQL connections to become available...');
  console.log('💡 This may take a few minutes as we wait for existing connections to timeout');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let testConnection;
    try {
      // Try to create a test connection
      testConnection = await mysql.createConnection({
        host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
        user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
        password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
        database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
        // Set longer timeouts for free hosting
        connectTimeout: 60000, // 60 seconds for free hosting
        keepAliveInitialDelay: 0,
        enableKeepAlive: true
      });
      
      await testConnection.execute('SELECT 1');
      
      console.log('✅ Database connection available');
      return true;
      
    } catch (error) {
      if (error.code === 'ER_USER_LIMIT_REACHED' || error.errno === 1226) {
        const delay = Math.min(baseDelay * Math.pow(1.2, attempt - 1), 15000); // Max 15 seconds
        console.log(`⚠️ Connection limit reached (attempt ${attempt}/${maxAttempts})`);
        console.log(`⏳ Waiting ${Math.round(delay/1000)}s for connections to timeout...`);
        
        // Show progress every 3 attempts
        if (attempt % 3 === 0) {
          console.log(`🔄 Still waiting... (${Math.round((attempt * baseDelay) / 1000)}s elapsed)`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } else {
        console.error('❌ Database connection error:', error.message);
        return false;
      }
    } finally {
      // Always close the test connection
      if (testConnection) {
        try {
          await testConnection.end();
        } catch (error) {
          // Ignore errors when closing
        }
      }
    }
  }
  
  console.error('❌ Could not establish database connection after all attempts');
  console.log('💡 Try waiting a few more minutes and restart the server');
  return false;
};

/**
 * Initialize database with connection management
 * Handles connection limits and cleanup
 */
const initializeDatabaseWithCleanup = async () => {
  console.log('🚀 Initializing database with connection management...');
  
  // For free hosting, try a simpler approach first
  try {
    console.log('🔄 Attempting simple connection test...');
    const mysql = require('mysql2/promise');
    
    const testConnection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
      user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
      database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
      connectTimeout: 60000,
      keepAliveInitialDelay: 0,
      enableKeepAlive: true
    });
    
    await testConnection.execute('SELECT 1');
    await testConnection.end();
    
    console.log('✅ Simple connection test successful');
    return true;
    
  } catch (error) {
    console.log('⚠️ Simple connection failed, trying cleanup approach...');
    console.log('❌ Error:', error.message);
    
    // If simple connection fails, try the cleanup approach
    try {
      // First, try to clean up existing connections
      await killExistingConnections();
      
      // Wait a moment for cleanup to take effect
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Wait for connection availability
      const isAvailable = await waitForConnectionAvailability();
      
      if (!isAvailable) {
        console.error('❌ Database initialization failed - connection limit exceeded');
        return false;
      }
      
      console.log('✅ Database initialization successful after cleanup');
      return true;
      
    } catch (cleanupError) {
      console.error('❌ Database initialization failed completely:', cleanupError.message);
      return false;
    }
  }
};

module.exports = {
  killExistingConnections,
  waitForConnectionAvailability,
  initializeDatabaseWithCleanup
};
