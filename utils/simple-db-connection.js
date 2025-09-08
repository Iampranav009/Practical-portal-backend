const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Simple Database Connection Utility
 * Designed specifically for free hosting services with connection limitations
 * Uses minimal connections and robust error handling
 */

let connection = null;
let isConnected = false;
let lastError = null;

/**
 * Get database connection with robust error handling
 * @returns {Promise<Object>} Database connection or null
 */
const getConnection = async () => {
  // If we already have a working connection, return it
  if (connection && isConnected) {
    try {
      // Test the connection
      await connection.execute('SELECT 1');
      return connection;
    } catch (error) {
      console.log('🔄 Existing connection failed, creating new one...');
      isConnected = false;
      connection = null;
    }
  }

  // Create new connection
  try {
    console.log('🔄 Creating new database connection...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
      user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
      database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
      connectTimeout: 30000, // 30 seconds
      acquireTimeout: 30000, // 30 seconds
      timeout: 30000, // 30 seconds
      // Keep connection alive
      keepAliveInitialDelay: 0,
      enableKeepAlive: true,
      // SSL for production
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test the connection
    await connection.execute('SELECT 1');
    isConnected = true;
    lastError = null;
    
    console.log('✅ Database connection established successfully');
    return connection;
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error message:', error.message || 'No message');
    console.error('   Error code:', error.code || 'No code');
    console.error('   Error errno:', error.errno || 'No errno');
    console.error('   Error sqlState:', error.sqlState || 'No sqlState');
    console.error('   Error sqlMessage:', error.sqlMessage || 'No sqlMessage');
    
    lastError = error;
    isConnected = false;
    connection = null;
    
    // Provide specific error guidance
    if (error.code === 'ER_USER_LIMIT_REACHED' || error.errno === 1226) {
      console.error('💡 Connection limit reached - too many connections to database');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused - check database host and port');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Access denied - check database username and password');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Database does not exist - check database name');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Connection timeout - database server is slow or unreachable');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Host not found - check database host URL');
    }
    
    return null;
  }
};

/**
 * Execute a query with automatic connection management
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query results
 */
const executeQuery = async (query, params = []) => {
  const conn = await getConnection();
  if (!conn) {
    throw new Error('Database connection not available');
  }
  
  try {
    const [results] = await conn.execute(query, params);
    return results;
  } catch (error) {
    console.error('❌ Query execution failed:', error.message);
    // If query fails, mark connection as bad
    isConnected = false;
    throw error;
  }
};

/**
 * Check if database is available
 * @returns {Promise<boolean>} Database availability
 */
const isDatabaseAvailable = async () => {
  try {
    await executeQuery('SELECT 1 as health_check');
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get connection status
 * @returns {Object} Connection status information
 */
const getConnectionStatus = () => {
  return {
    connected: isConnected,
    lastError: lastError ? {
      message: lastError.message,
      code: lastError.code,
      errno: lastError.errno
    } : null,
    timestamp: new Date().toISOString()
  };
};

/**
 * Close database connection
 */
const closeConnection = async () => {
  if (connection) {
    try {
      await connection.end();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.log('⚠️ Error closing connection:', error.message);
    }
    connection = null;
    isConnected = false;
  }
};

module.exports = {
  getConnection,
  executeQuery,
  isDatabaseAvailable,
  getConnectionStatus,
  closeConnection
};
