const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Robust Database Connection Utility
 * Ultimate solution for free hosting database connection issues
 * Implements multiple fallback strategies and circuit breaker pattern
 */

let connection = null;
let isConnected = false;
let lastError = null;
let connectionAttempts = 0;
let maxAttempts = 3;
let circuitBreakerOpen = false;
let circuitBreakerTimeout = 30000; // 30 seconds
let lastFailureTime = 0;

/**
 * Circuit breaker pattern to prevent excessive connection attempts
 */
const isCircuitBreakerOpen = () => {
  if (!circuitBreakerOpen) return false;
  
  const now = Date.now();
  if (now - lastFailureTime > circuitBreakerTimeout) {
    circuitBreakerOpen = false;
    connectionAttempts = 0;
    console.log('🔄 Circuit breaker reset - attempting connections again');
    return false;
  }
  
  return true;
};

/**
 * Open circuit breaker after repeated failures
 */
const openCircuitBreaker = () => {
  circuitBreakerOpen = true;
  lastFailureTime = Date.now();
  console.log('⚠️ Circuit breaker opened - too many connection failures');
};

/**
 * Create database connection with multiple strategies
 */
const createConnection = async (strategy = 'default') => {
  const configs = {
    default: {
      host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
      user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
      database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
      connectTimeout: 10000,
      keepAliveInitialDelay: 0,
      enableKeepAlive: true,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    },
    minimal: {
      host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
      user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
      database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
      connectTimeout: 5000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    },
    persistent: {
      host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
      user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
      password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
      database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
      connectTimeout: 30000,
      keepAliveInitialDelay: 0,
      enableKeepAlive: true,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  };

  const config = configs[strategy] || configs.default;
  
  try {
    console.log(`🔄 Attempting connection with ${strategy} strategy...`);
    const conn = await mysql.createConnection(config);
    
    // Test the connection
    await conn.execute('SELECT 1');
    
    console.log(`✅ Database connection successful with ${strategy} strategy`);
    return conn;
    
  } catch (error) {
    console.error(`❌ ${strategy} strategy failed:`, error.message);
    throw error;
  }
};

/**
 * Get database connection with multiple fallback strategies
 */
const getConnection = async () => {
  // Check circuit breaker
  if (isCircuitBreakerOpen()) {
    throw new Error('Circuit breaker is open - database connections temporarily disabled');
  }

  // If we already have a working connection, return it
  if (connection && isConnected) {
    try {
      await connection.execute('SELECT 1');
      return connection;
    } catch (error) {
      console.log('🔄 Existing connection failed, creating new one...');
      isConnected = false;
      connection = null;
    }
  }

  // Try different connection strategies
  const strategies = ['default', 'minimal', 'persistent'];
  
  for (const strategy of strategies) {
    try {
      connection = await createConnection(strategy);
      isConnected = true;
      lastError = null;
      connectionAttempts = 0;
      
      return connection;
      
    } catch (error) {
      console.error(`❌ ${strategy} strategy failed:`, error.message);
      lastError = error;
      connectionAttempts++;
      
      // If this is the last strategy, check if we should open circuit breaker
      if (strategy === strategies[strategies.length - 1]) {
        // Don't open circuit breaker for timeout errors - these are common with free hosting
        if (error.code !== 'ETIMEDOUT' && error.code !== 'ECONNRESET' && error.code !== 'PROTOCOL_CONNECTION_LOST') {
          if (connectionAttempts >= maxAttempts) {
            openCircuitBreaker();
          }
        }
        throw error;
      }
      
      // Wait before trying next strategy
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

/**
 * Execute query with automatic connection management
 */
const executeQuery = async (query, params = []) => {
  try {
    const conn = await getConnection();
    const [results] = await conn.execute(query, params);
    return results;
  } catch (error) {
    console.error('❌ Query execution failed:', error.message);
    isConnected = false;
    connection = null;
    
    // Don't open circuit breaker for timeout errors - these are common with free hosting
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('🔄 Database timeout/reset error - will retry on next request');
      return null; // Return null instead of throwing for timeout errors
    }
    
    throw error;
  }
};

/**
 * Check if database is available
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
 */
const getConnectionStatus = () => {
  return {
    connected: isConnected,
    circuitBreakerOpen: circuitBreakerOpen,
    connectionAttempts: connectionAttempts,
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

/**
 * Reset circuit breaker manually
 */
const resetCircuitBreaker = () => {
  circuitBreakerOpen = false;
  connectionAttempts = 0;
  lastFailureTime = 0;
  console.log('🔄 Circuit breaker manually reset');
};

module.exports = {
  getConnection,
  executeQuery,
  isDatabaseAvailable,
  getConnectionStatus,
  closeConnection,
  resetCircuitBreaker
};
