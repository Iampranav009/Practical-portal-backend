const mysql = require('mysql2/promise');
const retry = require('async-retry');
// Delegate query execution to robust pool wrapper for reliability
let robustPool;
try {
  robustPool = require('../db/robustPool');
} catch (_) {
  robustPool = null;
}
require('dotenv').config();

/**
 * Enhanced Database Connection Utility
 * Implements robust connection handling with retry logic, circuit breaker, and monitoring
 * Optimized for paid Hostinger MySQL (24/7 service) with enhanced performance settings
 */

let pool = null;
let isInitialized = false;
let circuitBreakerOpen = false;
let circuitBreakerTimeout = 30000; // 30 seconds
let lastFailureTime = 0;
let connectionStats = {
  totalConnections: 0,
  successfulConnections: 0,
  failedConnections: 0,
  timeouts: 0,
  resets: 0
};

/**
 * Circuit breaker pattern to prevent excessive connection attempts
 * Only opens for fatal errors, not timeouts
 */
const isCircuitBreakerOpen = () => {
  if (!circuitBreakerOpen) return false;
  
  const now = Date.now();
  if (now - lastFailureTime > circuitBreakerTimeout) {
    circuitBreakerOpen = false;
    console.log('🔄 Circuit breaker reset - attempting connections again');
    return false;
  }
  
  return true;
};

/**
 * Open circuit breaker after repeated fatal failures (not timeouts)
 */
const openCircuitBreaker = (error) => {
  // Only open circuit breaker for fatal errors, not timeouts
  const fatalErrors = [
    'ER_ACCESS_DENIED_ERROR',
    'ER_BAD_DB_ERROR', 
    'ER_NO_SUCH_TABLE',
    'ECONNREFUSED',
    'ENOTFOUND'
  ];
  
  if (fatalErrors.includes(error.code)) {
    circuitBreakerOpen = true;
    lastFailureTime = Date.now();
    console.log(`⚠️ Circuit breaker opened due to fatal error: ${error.code} - ${error.message}`);
  } else {
    console.log(`🔄 Non-fatal error ${error.code} - circuit breaker remains closed`);
  }
};

/**
 * Reset circuit breaker manually
 */
const resetCircuitBreaker = () => {
  circuitBreakerOpen = false;
  lastFailureTime = 0;
  console.log('🔄 Circuit breaker manually reset');
};

/**
 * Test database connection with detailed diagnostics
 */
const testConnection = async () => {
  console.log('🧪 Testing database connection with detailed diagnostics...');
  
  const config = {
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
    connectTimeout: 10000, // 10 seconds for testing
    acquireTimeout: 10000
  };
  
  console.log('📊 Connection config:', {
    host: config.host,
    database: config.database,
    user: config.user,
    connectTimeout: config.connectTimeout
  });
  
  try {
    const testPool = mysql.createPool(config);
    console.log('✅ Test pool created successfully');
    
    const connection = await testPool.getConnection();
    console.log('✅ Test connection acquired successfully');
    
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('✅ Test query executed successfully:', result);
    
    connection.release();
    await testPool.end();
    console.log('✅ Test connection closed successfully');
    
    return { success: true, message: 'Connection test passed' };
  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error errno:', error.errno);
    console.error('   Error sqlState:', error.sqlState);
    console.error('   Full error:', error);
    
    return { 
      success: false, 
      message: 'Connection test failed',
      error: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState
      }
    };
  }
};

/**
 * Test basic database connectivity without pool with detailed timing
 */
const testBasicConnection = async () => {
  console.log('🧪 Testing basic database connectivity with detailed timing...');
  
  const config = {
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
    port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '3306'),
    connectTimeout: 5000, // 5 seconds
    acquireTimeout: 5000
  };
  
  console.log('📊 Basic connection config:', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    connectTimeout: config.connectTimeout
  });
  
  const timing = {
    dnsStart: 0,
    dnsEnd: 0,
    tcpStart: 0,
    tcpEnd: 0,
    mysqlStart: 0,
    mysqlEnd: 0,
    queryStart: 0,
    queryEnd: 0
  };
  
  try {
    // Test DNS resolution first
    const dns = require('dns');
    const { promisify } = require('util');
    const lookup = promisify(dns.lookup);
    
    timing.dnsStart = Date.now();
    const dnsResult = await lookup(config.host);
    timing.dnsEnd = Date.now();
    
    console.log('✅ DNS resolution successful:', dnsResult);
    
    // Test with a simple connection
    timing.mysqlStart = Date.now();
    const connection = await mysql.createConnection(config);
    timing.mysqlEnd = Date.now();
    console.log('✅ Basic connection created successfully');
    
    // Test query execution (avoid reserved keyword alias)
    timing.queryStart = Date.now();
    const [result] = await connection.execute('SELECT 1 as test, NOW() as now_utc');
    timing.queryEnd = Date.now();
    console.log('✅ Basic query executed successfully:', result);
    
    await connection.end();
    console.log('✅ Basic connection closed successfully');
    
    const totalTime = timing.queryEnd - timing.dnsStart;
    const dnsTime = timing.dnsEnd - timing.dnsStart;
    const mysqlConnectTime = timing.mysqlEnd - timing.mysqlStart;
    const queryTime = timing.queryEnd - timing.queryStart;
    
    return { 
      success: true, 
      message: 'Basic connection test passed',
      timing: {
        totalMs: totalTime,
        dnsMs: dnsTime,
        mysqlConnectMs: mysqlConnectTime,
        queryMs: queryTime
      },
      dns: dnsResult,
      result: result
    };
  } catch (error) {
    console.error('❌ Basic connection test failed:');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error errno:', error.errno);
    console.error('   Error sqlState:', error.sqlState);
    console.error('   Full error:', error);
    
    const totalTime = Date.now() - timing.dnsStart;
    
    return { 
      success: false, 
      message: 'Basic connection test failed',
      timing: {
        totalMs: totalTime,
        dnsMs: timing.dnsEnd - timing.dnsStart,
        mysqlConnectMs: timing.mysqlEnd - timing.mysqlStart,
        queryMs: timing.queryEnd - timing.queryStart
      },
      error: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState
      }
    };
  }
};

/**
 * Create MySQL connection pool with optimized settings for paid Hostinger MySQL (24/7 service)
 * Implements multiple connection strategies for better reliability
 */
const createPool = () => {
  // Feature flag for extended debugging timeouts
  const debugTimeouts = process.env.DEBUG_DB_TIMEOUT === 'true';
  
  const config = {
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
    port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '3306'),
    
    // Connection pool settings - very conservative for stability
    waitForConnections: true,
    connectionLimit: 5, // Very small pool for better stability
    queueLimit: 0,
    
    // Connection timeout settings - configurable for debugging
    connectTimeout: debugTimeouts ? 20000 : 10000, // 20s for debug, 10s normal
    // Note: acquireTimeout is not a valid option in mysql2/promise
    
    // Connection cleanup settings - very aggressive
    idleTimeout: 60000, // 1 minute - very short idle time
    maxIdle: 2, // Very few idle connections
    
    // Keep-alive settings optimized for paid hosting
    keepAliveInitialDelay: 0,
    enableKeepAlive: true,
    
    // SSL configuration for production (Hostinger supports SSL)
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    
    // Additional settings for stability and performance
    charset: 'utf8mb4',
    timezone: 'Z',
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: false,
    debug: false,
    trace: false,
    
    // Note: reconnect options removed as they are invalid in mysql2/promise
    
    // Performance optimizations for paid hosting
    multipleStatements: false, // Security best practice
    namedPlaceholders: true, // Better performance
    typeCast: true, // Automatic type casting
    flags: ['-FOUND_ROWS'], // Optimize for Hostinger
    compress: false, // Disable compression for better performance on local network
    rowsAsArray: false // Return objects instead of arrays
  };

  console.log('🔄 Creating MySQL connection pool...');
  console.log('📊 Pool config:', {
    host: config.host,
    database: config.database,
    connectionLimit: config.connectionLimit,
    connectTimeout: config.connectTimeout
  });

  return mysql.createPool(config);
};

/**
 * Create minimal MySQL connection pool for fallback
 */
const createMinimalPool = () => {
  const config = {
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
    
    // Minimal settings for maximum compatibility
    waitForConnections: true,
    connectionLimit: 2, // Very small pool
    queueLimit: 0,
    connectTimeout: 5000, // 5 seconds
    idleTimeout: 30000, // 30 seconds
    maxIdle: 1, // Only 1 idle connection
    
    // Basic settings only
    charset: 'utf8mb4',
    timezone: 'Z',
    supportBigNumbers: true,
    bigNumberStrings: true,
    namedPlaceholders: true,
    typeCast: true,
    flags: ['-FOUND_ROWS'],
    compress: false,
    rowsAsArray: false,
    multipleStatements: false,
    debug: false,
    trace: false
  };

  console.log('🔄 Creating minimal MySQL connection pool...');
  return mysql.createPool(config);
};

/**
 * Create fallback MySQL connection pool with absolute minimum settings
 */
const createFallbackPool = () => {
  const config = {
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
    
    // Absolute minimum settings
    waitForConnections: true,
    connectionLimit: 1, // Single connection
    queueLimit: 0,
    connectTimeout: 3000, // 3 seconds
    idleTimeout: 10000, // 10 seconds
    maxIdle: 0, // No idle connections
    
    // Only essential settings
    charset: 'utf8mb4',
    namedPlaceholders: true,
    typeCast: true
  };

  console.log('🔄 Creating fallback MySQL connection pool...');
  return mysql.createPool(config);
};

/**
 * Initialize database connection pool with multiple retry strategies
 */
const initializePool = async () => {
  if (isInitialized && pool) {
    return pool;
  }

  // Try multiple connection strategies
  const strategies = [
    { name: 'Standard', config: createPool },
    { name: 'Minimal', config: createMinimalPool },
    { name: 'Fallback', config: createFallbackPool }
  ];

  for (const strategy of strategies) {
    try {
      console.log(`🔄 Trying ${strategy.name} connection strategy...`);
      pool = strategy.config();
      
      // Add detailed connection diagnostics
      console.log(`📊 ${strategy.name} strategy config:`, {
        host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
        database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
        user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
        connectionLimit: strategy.name === 'Standard' ? 5 : strategy.name === 'Minimal' ? 2 : 1,
        connectTimeout: strategy.name === 'Standard' ? 10000 : strategy.name === 'Minimal' ? 5000 : 3000
      });
      
      // Test the pool with a simple query with timeout
      const testPromise = pool.execute('SELECT 1 as health_check');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection test timeout')), 5000)
      );
      
      await Promise.race([testPromise, timeoutPromise]);
      
      isInitialized = true;
      connectionStats.successfulConnections++;
      console.log(`✅ Database pool initialized successfully with ${strategy.name} strategy`);
      
      // Set up pool event listeners
      pool.on('connection', (connection) => {
        connectionStats.totalConnections++;
        console.log('🔗 New database connection established');
      });

      pool.on('error', (err) => {
        connectionStats.failedConnections++;
        console.error('❌ Database pool error:', err.message);
        
        // Use improved circuit breaker logic
        if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST') {
          connectionStats.timeouts++;
        } else {
          // Check if we should open circuit breaker for fatal errors
          if (connectionStats.failedConnections > 3) {
            openCircuitBreaker(err);
          }
        }
      });

      return pool;
    } catch (error) {
      console.error(`❌ ${strategy.name} strategy failed:`);
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error code: ${error.code}`);
      console.error(`   Error errno: ${error.errno}`);
      console.error(`   Error sqlState: ${error.sqlState}`);
      console.error(`   Full error:`, error);
      
      if (pool) {
        try {
          await pool.end();
        } catch (e) {
          console.error(`   Cleanup error: ${e.message}`);
        }
        pool = null;
      }
    }
  }

  // All strategies failed
  connectionStats.failedConnections++;
  console.error('❌ All connection strategies failed');
  throw new Error('Unable to establish database connection with any strategy');
};

/**
 * Test socket-level connectivity before attempting MySQL connection
 */
const testSocketConnectivity = async (host, port, timeout = 3000) => {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve({ success: true, message: 'Socket connection successful' });
    });
    
    socket.on('error', (error) => {
      resolve({ 
        success: false, 
        message: 'Socket connection failed', 
        error: error.message,
        code: error.code 
      });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ 
        success: false, 
        message: 'Socket connection timeout' 
      });
    });
    
    socket.connect(port, host);
  });
};

/**
 * Get database connection with socket pre-check and enhanced retry logic
 */
const getConnection = async () => {
  // Check circuit breaker
  if (isCircuitBreakerOpen()) {
    throw new Error('Circuit breaker is open - database connections temporarily disabled');
  }

  if (!isInitialized) {
    await initializePool();
  }

  // Pre-check socket connectivity
  const host = process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '3306');
  
  console.log('🔍 Pre-checking socket connectivity...');
  const socketTest = await testSocketConnectivity(host, port, 3000);
  
  if (!socketTest.success) {
    console.error('❌ Socket pre-check failed:', socketTest.message);
    connectionStats.failedConnections++;
    
    // Don't open circuit breaker for socket-level failures
    if (socketTest.code === 'ETIMEDOUT' || socketTest.code === 'ECONNREFUSED') {
      connectionStats.timeouts++;
    }
    
    throw new Error(`Socket connectivity failed: ${socketTest.message}`);
  }
  
  console.log('✅ Socket pre-check passed, attempting MySQL connection...');

  return await retry(
    async (bail) => {
      try {
        const connection = await pool.getConnection();
        console.log('🔗 Database connection acquired');
        return connection;
      } catch (error) {
        console.error('❌ Failed to get database connection:', error.message);
        
        // Don't retry for certain errors
        if (error.code === 'ER_ACCESS_DENIED_ERROR' || 
            error.code === 'ER_BAD_DB_ERROR' || 
            error.code === 'ER_NO_SUCH_TABLE') {
          bail(error);
          return;
        }
        
        // Don't open circuit breaker for timeout errors
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
          connectionStats.timeouts++;
          throw error;
        }
        
        connectionStats.failedConnections++;
        throw error;
      }
    },
    {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 5000,
      onRetry: (error, attempt) => {
        console.log(`🔄 Retrying database connection (attempt ${attempt}):`, error.message);
      }
    }
  );
};

/**
 * Execute query with automatic connection management and timeout handling
 */
const executeQuery = async (query, params = []) => {
  // Prefer robust pool's query if available
  if (robustPool && typeof robustPool.query === 'function') {
    try {
      return await robustPool.query(query, params);
    } catch (error) {
      console.error('❌ RobustPool query failed, falling back:', error.message);
      // fall through to legacy path
    }
  }

  let connection = null;
  try {
    connection = await getConnection();
    const queryPromise = connection.execute(query, params);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 10000));
    const [results] = await Promise.race([queryPromise, timeoutPromise]);
    return results;
  } catch (error) {
    console.error('❌ Query execution failed:');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error errno:', error.errno);
    console.error('   Error sqlState:', error.sqlState);
    
    // Handle specific error types
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST' || error.message === 'Query timeout') {
      connectionStats.timeouts++;
      console.log('🔄 Database timeout/reset error - will retry on next request');
      return null; // Return null instead of throwing for timeout errors
    }
    
    if (error.code === 'ER_LOCK_WAIT_TIMEOUT' || error.code === 'ER_LOCK_DEADLOCK') {
      console.log('🔄 Database lock error - will retry on next request');
      return null;
    }
    
    throw error;
  } finally {
    if (connection) {
      try { connection.release(); } catch (_) {}
    }
  }
};

/**
 * Execute multiple queries in a transaction
 */
const executeTransaction = async (queries) => {
  let connection = null;
  
  try {
    connection = await getConnection();
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params = [] } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
        console.log('🔄 Transaction rolled back due to error');
      } catch (rollbackError) {
        console.error('❌ Error rolling back transaction:', rollbackError.message);
      }
    }
    throw error;
  } finally {
    if (connection) {
      try {
        connection.release();
        console.log('🔗 Database connection released');
      } catch (releaseError) {
        console.error('❌ Error releasing connection:', releaseError.message);
      }
    }
  }
};

/**
 * Check if database is available
 */
const isDatabaseAvailable = async () => {
  try {
    const result = await executeQuery('SELECT 1 as health_check');
    return result !== null;
  } catch (error) {
    console.error('❌ Database availability check failed:', error.message);
    return false;
  }
};

/**
 * Get connection pool statistics
 */
const getPoolStats = () => {
  if (!pool) {
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      queuedRequests: 0,
      connectionStats: connectionStats,
      circuitBreakerOpen: circuitBreakerOpen,
      isInitialized: isInitialized
    };
  }

  return {
    totalConnections: pool.pool?._allConnections?.length || 0,
    activeConnections: (pool.pool?._allConnections?.length || 0) - (pool.pool?._freeConnections?.length || 0),
    idleConnections: pool.pool?._freeConnections?.length || 0,
    queuedRequests: pool.pool?._connectionQueue?.length || 0,
    connectionStats: connectionStats,
    circuitBreakerOpen: circuitBreakerOpen,
    isInitialized: isInitialized
  };
};

/**
 * Get connection status
 */
const getConnectionStatus = () => {
  return {
    connected: isInitialized && pool !== null,
    circuitBreakerOpen: circuitBreakerOpen,
    connectionStats: connectionStats,
    timestamp: new Date().toISOString()
  };
};

/**
 * Close database connection pool
 */
const closePool = async () => {
  if (pool) {
    try {
      await pool.end();
      console.log('✅ Database pool closed');
      pool = null;
      isInitialized = false;
    } catch (error) {
      console.error('❌ Error closing database pool:', error.message);
    }
  }
};

/**
 * Health check for database
 */
const healthCheck = async () => {
  try {
    const startTime = Date.now();
    const result = await executeQuery('SELECT 1 as health_check');
    const responseTime = Date.now() - startTime;
    
    return {
      healthy: true,
      responseTime: responseTime,
      result: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Test SSL connection variants for Hostinger compatibility
 */
const testSSLConnection = async () => {
  console.log('🧪 Testing SSL connection variants...');
  
  const baseConfig = {
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
    port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '3306'),
    connectTimeout: 5000
  };
  
  const sslVariants = [
    { name: 'No SSL', ssl: false },
    { name: 'SSL Reject Unauthorized False', ssl: { rejectUnauthorized: false } },
    { name: 'SSL Reject Unauthorized True', ssl: { rejectUnauthorized: true } },
    { name: 'SSL Amazon RDS', ssl: 'Amazon RDS' },
    { name: 'SSL True', ssl: true }
  ];
  
  const results = [];
  
  for (const variant of sslVariants) {
    try {
      console.log(`🔄 Testing ${variant.name}...`);
      const config = { ...baseConfig, ssl: variant.ssl };
      
      const startTime = Date.now();
      const connection = await mysql.createConnection(config);
      const connectTime = Date.now() - startTime;
      
      const [result] = await connection.execute('SELECT 1 as test');
      await connection.end();
      
      results.push({
        variant: variant.name,
        success: true,
        connectTimeMs: connectTime,
        result: result
      });
      
      console.log(`✅ ${variant.name} successful (${connectTime}ms)`);
    } catch (error) {
      results.push({
        variant: variant.name,
        success: false,
        error: {
          message: error.message,
          code: error.code,
          errno: error.errno
        }
      });
      
      console.log(`❌ ${variant.name} failed: ${error.message}`);
    }
  }
  
  const successfulVariants = results.filter(r => r.success);
  
  return {
    success: successfulVariants.length > 0,
    message: successfulVariants.length > 0 
      ? `Found ${successfulVariants.length} working SSL variant(s)` 
      : 'No SSL variants worked',
    results: results,
    recommended: successfulVariants.length > 0 ? successfulVariants[0] : null
  };
};

module.exports = {
  initializePool,
  getConnection,
  executeQuery,
  executeTransaction,
  isDatabaseAvailable,
  getPoolStats,
  getConnectionStatus,
  closePool,
  healthCheck,
  resetCircuitBreaker,
  testConnection,
  testBasicConnection,
  testSSLConnection
};
