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
  try {
    // Create a temporary connection to kill other connections
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
      user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
      database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal'
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
    
    await tempConnection.end();
    return true;
    
  } catch (error) {
    console.error('❌ Error during connection cleanup:', error.message);
    return false;
  }
};

/**
 * Wait for connections to be available
 * Implements exponential backoff and waits for natural connection timeout
 */
const waitForConnectionAvailability = async (maxAttempts = 20, baseDelay = 2000) => {
  console.log('⏳ Waiting for MySQL connections to become available...');
  console.log('💡 This may take a few minutes as we wait for existing connections to timeout');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Try to create a test connection
      const testConnection = await mysql.createConnection({
        host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
        user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
        password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
        database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
        // Set very short timeouts to fail fast
        connectTimeout: 5000,
        acquireTimeout: 5000
      });
      
      await testConnection.execute('SELECT 1');
      await testConnection.end();
      
      console.log('✅ Database connection available');
      return true;
      
    } catch (error) {
      if (error.code === 'ER_USER_LIMIT_REACHED' || error.errno === 1226) {
        const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1), 30000); // Max 30 seconds
        console.log(`⚠️ Connection limit reached (attempt ${attempt}/${maxAttempts})`);
        console.log(`⏳ Waiting ${Math.round(delay/1000)}s for connections to timeout...`);
        
        // Show progress every 10 seconds
        if (attempt % 5 === 0) {
          console.log(`🔄 Still waiting... (${Math.round((attempt * baseDelay) / 1000)}s elapsed)`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } else {
        console.error('❌ Database connection error:', error.message);
        return false;
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
  
  // First, try to clean up existing connections
  await killExistingConnections();
  
  // Wait a moment for cleanup to take effect
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Wait for connection availability
  const isAvailable = await waitForConnectionAvailability();
  
  if (!isAvailable) {
    console.error('❌ Database initialization failed - connection limit exceeded');
    return false;
  }
  
  console.log('✅ Database initialization successful');
  return true;
};

module.exports = {
  killExistingConnections,
  waitForConnectionAvailability,
  initializeDatabaseWithCleanup
};
