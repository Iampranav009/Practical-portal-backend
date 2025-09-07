const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
require('dotenv').config();

// Enhanced database connection
const { 
  initializePool, 
  executeQuery, 
  isDatabaseAvailable, 
  getPoolStats, 
  getConnectionStatus, 
  closePool, 
  healthCheck,
  resetCircuitBreaker 
} = require('./utils/enhanced-db-connection');

// Monitoring and logging
const { 
  logger, 
  requestMonitor, 
  monitorSocketConnection, 
  getHealthStatus 
} = require('./utils/monitoring');

/**
 * Validate required environment variables
 * Ensures all critical environment variables are set before starting the server
 */
const validateEnvironment = () => {
  // Check for both new and old environment variable names
  const requiredEnvVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_USER', 
    'DB_PASSWORD',
    'DB_NAME'
  ];

  const missingVars = requiredEnvVars.filter(envVar => {
    // Check if the new variable exists, or if the old variable exists as fallback
    const newVar = process.env[envVar];
    const oldVar = process.env[envVar.replace('DB_', 'DATABASE_')];
    return !newVar && !oldVar;
  });
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing required environment variables:');
    missingVars.forEach(envVar => {
      console.warn(`   - ${envVar} (or ${envVar.replace('DB_', 'DATABASE_')})`);
    });
    console.warn('\n💡 Server will start in limited mode without database features.');
    console.warn('💡 Please check your .env file and ensure all required variables are set.');
    console.warn('💡 You can use either the new format (DB_*) or old format (DATABASE_*)');
    return false; // Don't exit, just return false
  }
  
  console.log('✅ All required environment variables are set');
  return true;
};

// Validate environment variables before proceeding
const envValid = validateEnvironment();

const { testConnection, initializeTables, monitorConnections } = require('./db/connection');
const { initializeDatabaseWithCleanup } = require('./utils/connection-reset');
const { apiRateLimit, setSecurityHeaders, sanitizeInput } = require('./middleware/validation');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const batchRoutes = require('./routes/batch');
const submissionRoutes = require('./routes/submission');
const dashboardRoutes = require('./routes/dashboard');
const uploadRoutes = require('./routes/upload');
const announcementRoutes = require('./routes/announcement');
const notificationRoutes = require('./routes/notifications');

/**
 * Express.js Server Setup
 * Main server file for Practical Portal backend API
 * Handles CORS, routing, and database initialization
 */

const app = express();
const server = http.createServer(app);

// Trust proxy for proper IP detection and rate limiting
app.set('trust proxy', 1);

// Configure CORS to allow both localhost and Vercel deployment
const allowedOrigins = [
  'http://localhost:3000',
  'https://practicalportal.vercel.app',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN
].filter(Boolean); // Remove any undefined values

console.log('🌐 Allowed CORS origins:', allowedOrigins);

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowing origin:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        console.log('✅ Socket.IO CORS allowing origin:', origin);
        return callback(null, true);
      }
      
      console.log('❌ Socket.IO CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const PORT = process.env.PORT || 5000;

// CORS is now handled by the cors middleware above

// Security middleware (applied after CORS)
app.use(setSecurityHeaders);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes with enhanced error handling
app.use('/api', (req, res, next) => {
  // Wrap rate limiting in try-catch to handle X-Forwarded-For errors gracefully
  try {
    apiRateLimit(req, res, next);
  } catch (error) {
    console.error('Rate limiting error:', error.message);
    // If rate limiting fails, continue without rate limiting
    next();
  }
});

// Input sanitization for all routes
app.use(sanitizeInput);

// Request monitoring
app.use(requestMonitor);

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  console.log('🧪 CORS test endpoint hit');
  console.log('🧪 Origin:', req.headers.origin);
  res.json({
    success: true,
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Enhanced health check endpoint with comprehensive monitoring
app.get('/health', async (req, res) => {
  try {
    const healthStatus = getHealthStatus();
    const dbHealth = await healthCheck();
    const poolStats = getPoolStats();
    const connectionStatus = getConnectionStatus();
    
    const isHealthy = healthStatus.status === 'healthy' && dbHealth.healthy;
    const statusCode = isHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      success: isHealthy,
      message: isHealthy ? 'Practical Portal API is running' : 'Service degraded',
      timestamp: new Date().toISOString(),
      status: healthStatus.status,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      monitoring: healthStatus,
      database: {
        healthy: dbHealth.healthy,
        responseTime: dbHealth.responseTime,
        poolStats: poolStats,
        connectionStatus: connectionStatus
      }
    });
  } catch (error) {
    logger.error('Health check error', { error: error.message });
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Database-only health check endpoint
app.get('/health/db', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    const statusCode = dbHealth.healthy ? 200 : 503;
    
    res.status(statusCode).json({
      success: dbHealth.healthy,
      message: dbHealth.healthy ? 'Database is healthy' : 'Database is unavailable',
      timestamp: new Date().toISOString(),
      database: dbHealth
    });
  } catch (error) {
    console.error('Database health check error:', error.message);
    res.status(503).json({
      success: false,
      message: 'Database health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Database diagnostic endpoint
app.get('/health/db/diagnose', async (req, res) => {
  try {
    const { testConnection } = require('./utils/enhanced-db-connection');
    const testResult = await testConnection();
    
    res.json({
      success: testResult.success,
      message: testResult.message,
      timestamp: new Date().toISOString(),
      diagnostic: testResult
    });
  } catch (error) {
    console.error('Database diagnostic error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Database diagnostic failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Basic database connectivity test endpoint
app.get('/health/db/basic', async (req, res) => {
  try {
    const { testBasicConnection } = require('./utils/enhanced-db-connection');
    const testResult = await testBasicConnection();
    
    res.json({
      success: testResult.success,
      message: testResult.message,
      timestamp: new Date().toISOString(),
      diagnostic: testResult
    });
  } catch (error) {
    console.error('Basic database test error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Basic database test failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Socket-level connectivity test endpoint
app.get('/health/db/sockettest', async (req, res) => {
  try {
    const net = require('net');
    const dns = require('dns');
    const { promisify } = require('util');
    const lookup = promisify(dns.lookup);
    
    const host = process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '3306');
    
    const results = {
      dns: null,
      tcpConnect: null,
      timestamp: new Date().toISOString()
    };
    
    // Test DNS resolution
    try {
      const dnsStart = Date.now();
      const dnsResult = await lookup(host);
      const dnsTime = Date.now() - dnsStart;
      
      results.dns = {
        success: true,
        address: dnsResult.address,
        family: dnsResult.family,
        timeMs: dnsTime
      };
    } catch (dnsError) {
      results.dns = {
        success: false,
        error: dnsError.message,
        code: dnsError.code
      };
    }
    
    // Test TCP connection
    try {
      const tcpStart = Date.now();
      const tcpResult = await new Promise((resolve, reject) => {
        const socket = new net.Socket();
        const timeout = 5000; // 5 second timeout
        
        socket.setTimeout(timeout);
        
        socket.on('connect', () => {
          const tcpTime = Date.now() - tcpStart;
          socket.destroy();
          resolve({
            success: true,
            timeMs: tcpTime
          });
        });
        
        socket.on('error', (error) => {
          reject(error);
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('TCP connection timeout'));
        });
        
        socket.connect(port, host);
      });
      
      results.tcpConnect = tcpResult;
    } catch (tcpError) {
      results.tcpConnect = {
        success: false,
        error: tcpError.message,
        code: tcpError.code
      };
    }
    
    const overallSuccess = results.dns.success && results.tcpConnect.success;
    const statusCode = overallSuccess ? 200 : 503;
    
    res.status(statusCode).json({
      success: overallSuccess,
      message: overallSuccess ? 'Socket connectivity test passed' : 'Socket connectivity test failed',
      timestamp: new Date().toISOString(),
      host: host,
      port: port,
      results: results
    });
  } catch (error) {
    console.error('Socket test error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Socket test failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// SSL connection test endpoint
app.get('/health/db/ssl', async (req, res) => {
  try {
    const { testSSLConnection } = require('./utils/enhanced-db-connection');
    const testResult = await testSSLConnection();
    
    const statusCode = testResult.success ? 200 : 503;
    
    res.status(statusCode).json({
      success: testResult.success,
      message: testResult.message,
      timestamp: new Date().toISOString(),
      results: testResult.results,
      recommended: testResult.recommended
    });
  } catch (error) {
    console.error('SSL test error:', error.message);
    res.status(500).json({
      success: false,
      message: 'SSL test failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Enhanced environment validation endpoint
app.get('/health/env', (req, res) => {
  const envVars = {
    DB_HOST: process.env.DB_HOST || process.env.DATABASE_HOST || 'NOT_SET',
    DB_PORT: process.env.DB_PORT || process.env.DATABASE_PORT || 'NOT_SET',
    DB_USER: process.env.DB_USER || process.env.DATABASE_USER || 'NOT_SET',
    DB_PASSWORD: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'NOT_SET',
    DB_NAME: process.env.DB_NAME || process.env.DATABASE_NAME || 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET'
  };
  
  // Check for missing variables
  const missingVars = Object.entries(envVars)
    .filter(([key, value]) => value === 'NOT_SET')
    .map(([key]) => key);
  
  const isValid = missingVars.length === 0;
  const statusCode = isValid ? 200 : 503;
  
  res.status(statusCode).json({
    success: isValid,
    message: isValid ? 'All required environment variables are set' : 'Missing required environment variables',
    timestamp: new Date().toISOString(),
    environment: {
      ...envVars,
      // Don't expose password in response
      DB_PASSWORD: envVars.DB_PASSWORD === 'NOT_SET' ? 'NOT_SET' : '***HIDDEN***'
    },
    missing: missingVars
  });
});

// Comprehensive diagnostic endpoint
app.get('/health/db/comprehensive', async (req, res) => {
  try {
    const { testBasicConnection, testSSLConnection } = require('./utils/enhanced-db-connection');
    const net = require('net');
    const dns = require('dns');
    const { promisify } = require('util');
    const lookup = promisify(dns.lookup);
    
    const host = process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '3306');
    
    console.log('🔍 Running comprehensive database diagnostics...');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      host: host,
      port: port,
      environment: {
        DB_HOST: process.env.DB_HOST || process.env.DATABASE_HOST || 'NOT_SET',
        DB_PORT: process.env.DB_PORT || process.env.DATABASE_PORT || 'NOT_SET',
        DB_USER: process.env.DB_USER || process.env.DATABASE_USER || 'NOT_SET',
        DB_PASSWORD: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || 'NOT_SET',
        DB_NAME: process.env.DB_NAME || process.env.DATABASE_NAME || 'NOT_SET',
        NODE_ENV: process.env.NODE_ENV || 'NOT_SET'
      },
      tests: {}
    };
    
    // Test 1: DNS Resolution
    try {
      const dnsStart = Date.now();
      const dnsResult = await lookup(host);
      const dnsTime = Date.now() - dnsStart;
      
      diagnostics.tests.dns = {
        success: true,
        address: dnsResult.address,
        family: dnsResult.family,
        timeMs: dnsTime
      };
    } catch (dnsError) {
      diagnostics.tests.dns = {
        success: false,
        error: dnsError.message,
        code: dnsError.code
      };
    }
    
    // Test 2: TCP Socket Connection
    try {
      const tcpStart = Date.now();
      const tcpResult = await new Promise((resolve, reject) => {
        const socket = new net.Socket();
        const timeout = 5000;
        
        socket.setTimeout(timeout);
        
        socket.on('connect', () => {
          const tcpTime = Date.now() - tcpStart;
          socket.destroy();
          resolve({
            success: true,
            timeMs: tcpTime
          });
        });
        
        socket.on('error', (error) => {
          reject(error);
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('TCP connection timeout'));
        });
        
        socket.connect(port, host);
      });
      
      diagnostics.tests.tcp = tcpResult;
    } catch (tcpError) {
      diagnostics.tests.tcp = {
        success: false,
        error: tcpError.message,
        code: tcpError.code
      };
    }
    
    // Test 3: Basic MySQL Connection
    try {
      const basicResult = await testBasicConnection();
      diagnostics.tests.basic = basicResult;
    } catch (basicError) {
      diagnostics.tests.basic = {
        success: false,
        error: basicError.message
      };
    }
    
    // Test 4: SSL Variants
    try {
      const sslResult = await testSSLConnection();
      diagnostics.tests.ssl = sslResult;
    } catch (sslError) {
      diagnostics.tests.ssl = {
        success: false,
        error: sslError.message
      };
    }
    
    // Test 5: Pool Health
    try {
      const poolStats = getPoolStats();
      const connectionStatus = getConnectionStatus();
      const dbHealth = await healthCheck();
      
      diagnostics.tests.pool = {
        stats: poolStats,
        status: connectionStatus,
        health: dbHealth
      };
    } catch (poolError) {
      diagnostics.tests.pool = {
        success: false,
        error: poolError.message
      };
    }
    
    // Overall assessment
    const allTests = Object.values(diagnostics.tests);
    const successfulTests = allTests.filter(test => test.success !== false);
    const overallSuccess = successfulTests.length > 0;
    
    diagnostics.summary = {
      overallSuccess: overallSuccess,
      totalTests: allTests.length,
      successfulTests: successfulTests.length,
      failedTests: allTests.length - successfulTests.length
    };
    
    const statusCode = overallSuccess ? 200 : 503;
    
    res.status(statusCode).json({
      success: overallSuccess,
      message: overallSuccess ? 'Some database connectivity tests passed' : 'All database connectivity tests failed',
      timestamp: new Date().toISOString(),
      diagnostics: diagnostics
    });
  } catch (error) {
    console.error('Comprehensive diagnostic error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Comprehensive diagnostic failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Debug timeout toggle endpoint
app.post('/health/debug-timeouts', (req, res) => {
  try {
    const { enable } = req.body;
    
    if (typeof enable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Please provide enable: true/false in request body',
        timestamp: new Date().toISOString()
      });
    }
    
    process.env.DEBUG_DB_TIMEOUT = enable ? 'true' : 'false';
    
    res.json({
      success: true,
      message: `Debug timeouts ${enable ? 'enabled' : 'disabled'}`,
      timestamp: new Date().toISOString(),
      debugTimeouts: enable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle debug timeouts',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Circuit breaker reset endpoint (for debugging)
app.post('/health/reset-circuit-breaker', (req, res) => {
  try {
    resetCircuitBreaker();
    res.json({
      success: true,
      message: 'Circuit breaker reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset circuit breaker',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Make Socket.IO instance available to routes
app.set('io', io);

// API Routes - only load if environment is valid
if (envValid) {
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/batches', batchRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/notifications', notificationRoutes);
} else {
  // Mock endpoints for limited mode
  app.get('/api/auth/test', (req, res) => {
    res.json({
      success: true,
      message: 'Auth endpoint is working (Limited Mode)',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/auth/user/:firebaseUid', (req, res) => {
    const { firebaseUid } = req.params;
    console.log('🔐 Mock user endpoint hit for UID:', firebaseUid);
    res.json({
      success: true,
      message: 'User endpoint is working (Limited Mode)',
      firebaseUid: firebaseUid,
      timestamp: new Date().toISOString()
    });
  });

  app.post('/api/auth/register', (req, res) => {
    console.log('🔐 Mock register endpoint hit');
    res.json({
      success: true,
      message: 'Register endpoint is working (Limited Mode)',
      data: req.body,
      timestamp: new Date().toISOString()
    });
  });

  app.post('/api/auth/google-signin', (req, res) => {
    console.log('🔐 Mock Google signin endpoint hit');
    res.json({
      success: true,
      message: 'Google signin endpoint is working (Limited Mode)',
      data: req.body,
      timestamp: new Date().toISOString()
    });
  });

  app.post('/api/auth/signin', (req, res) => {
    console.log('🔐 Mock signin endpoint hit');
    res.json({
      success: true,
      message: 'Signin endpoint is working (Limited Mode)',
      data: req.body,
      timestamp: new Date().toISOString()
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    console.log('🔐 Mock logout endpoint hit');
    res.json({
      success: true,
      message: 'Logout endpoint is working (Limited Mode)',
      timestamp: new Date().toISOString()
    });
  });
}

// Enhanced Socket.IO connection handling with robust error handling
io.on('connection', (socket) => {
  logger.info('Socket.IO connection established', { socketId: socket.id });
  
  // Monitor socket connection
  monitorSocketConnection(socket);

  // Join batch room for real-time updates
  socket.on('joinBatch', (batchId) => {
    try {
      if (!batchId || typeof batchId !== 'string' && typeof batchId !== 'number') {
        console.error('❌ Invalid batchId for joinBatch:', batchId);
        return;
      }
      socket.join(`batch_${batchId}`);
      console.log(`✅ User ${socket.id} joined batch ${batchId}`);
    } catch (error) {
      console.error('❌ Error joining batch:', error.message);
    }
  });

  // Leave batch room
  socket.on('leaveBatch', (batchId) => {
    try {
      if (!batchId || typeof batchId !== 'string' && typeof batchId !== 'number') {
        console.error('❌ Invalid batchId for leaveBatch:', batchId);
        return;
      }
      socket.leave(`batch_${batchId}`);
      console.log(`✅ User ${socket.id} left batch ${batchId}`);
    } catch (error) {
      console.error('❌ Error leaving batch:', error.message);
    }
  });

  // Join teacher notification room
  socket.on('join_teacher_notifications', (teacherId) => {
    try {
      if (!teacherId || typeof teacherId !== 'string' && typeof teacherId !== 'number') {
        console.error('❌ Invalid teacherId for join_teacher_notifications:', teacherId);
        return;
      }
      socket.join(`teacher_notifications_${teacherId}`);
      console.log(`✅ User ${socket.id} joined teacher notifications for ${teacherId}`);
    } catch (error) {
      console.error('❌ Error joining teacher notifications:', error.message);
    }
  });

  // Leave teacher notification room
  socket.on('leave_teacher_notifications', (teacherId) => {
    try {
      if (!teacherId || typeof teacherId !== 'string' && typeof teacherId !== 'number') {
        console.error('❌ Invalid teacherId for leave_teacher_notifications:', teacherId);
        return;
      }
      socket.leave(`teacher_notifications_${teacherId}`);
      console.log(`✅ User ${socket.id} left teacher notifications for ${teacherId}`);
    } catch (error) {
      console.error('❌ Error leaving teacher notifications:', error.message);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`❌ User disconnected: ${socket.id}, reason: ${reason}`);
    console.log('📊 Socket.IO connections:', io.engine.clientsCount);
  });

  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  // Handle any other events to prevent namespace errors
  // Add handlers for common events that might cause namespace errors
  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('pong', () => {
    // Handle pong responses
  });

  // Handle any unknown events gracefully
  const originalEmit = socket.emit;
  socket.emit = function(event, ...args) {
    try {
      return originalEmit.call(this, event, ...args);
    } catch (error) {
      console.error(`❌ Socket emit error for event ${event}:`, error.message);
    }
  };

  // Handle errors gracefully
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error.message);
  });
});

// Enhanced error handling for Socket.IO
io.engine.on('connection_error', (err) => {
  console.error('❌ Socket.IO connection error:', err.message);
  console.error('❌ Error details:', err);
});

// Handle Socket.IO server errors
io.on('error', (error) => {
  console.error('❌ Socket.IO server error:', error.message);
});

// Handle Socket.IO namespace errors
io.of('/').on('error', (error) => {
  console.error('❌ Socket.IO namespace error:', error.message);
});

// Handle Socket.IO packet errors
io.engine.on('packet', (packet) => {
  try {
    // Process packet normally
  } catch (error) {
    console.error('❌ Socket.IO packet error:', error.message);
  }
});

// Monitor Socket.IO connections
setInterval(() => {
  console.log('📊 Socket.IO Stats:', {
    connections: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
}, 60000); // Log every minute

// Make Socket.IO instance available globally for announcement events
global.io = io;

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  // Handle specific error types
  if (err.code === 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR') {
    console.log('⚠️ Rate limiting X-Forwarded-For error - continuing without rate limiting');
    return next(); // Continue without rate limiting
  }
  
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please try again in a moment.',
      retryAfter: 30,
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.code === 'ER_LOCK_WAIT_TIMEOUT' || err.code === 'ER_LOCK_DEADLOCK') {
    return res.status(503).json({
      success: false,
      message: 'Database is busy. Please try again in a moment.',
      retryAfter: 10,
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ER_BAD_DB_ERROR') {
    return res.status(503).json({
      success: false,
      message: 'Database configuration error. Please contact support.',
      timestamp: new Date().toISOString()
    });
  }
  
  // CORS errors
  if (err.message && err.message.includes('Not allowed by CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation. Origin not allowed.',
      timestamp: new Date().toISOString()
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

/**
 * Initialize and start server with enhanced error handling
 * Tests database connection and creates tables before starting
 */
const startServer = async () => {
  try {
    // If environment variables are missing, start in limited mode
    if (!envValid) {
      logger.warn('Starting server in limited mode (no database)', { 
        missingEnvVars: !envValid 
      });
      
      // Start server in limited mode
      server.listen(PORT, () => {
        logger.info('Server started in LIMITED MODE', {
          port: PORT,
          mode: 'LIMITED',
          database: false
        });
        console.log(`🚀 Server running on port ${PORT} (LIMITED MODE)`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
        console.log(`⚡ Socket.IO enabled for real-time updates`);
        console.log(`⚠️ Database features disabled - environment variables missing`);
      });
      return;
    }

    // Try enhanced database connection test
    console.log('🔄 Testing enhanced database connection...');
    const dbAvailable = await isDatabaseAvailable();
    
    if (!dbAvailable) {
      console.log('⚠️ Database not immediately available, starting in fallback mode...');
      console.log('💡 Database connections will be attempted on-demand');
      console.log('💡 This is common with free database hosting services');
      
      // Start server in fallback mode
      server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} (FALLBACK MODE)`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
        console.log(`⚡ Socket.IO enabled for real-time updates`);
        console.log(`⚠️ Database features will be attempted on-demand`);
        console.log(`💡 Server will continue to run and attempt database connections when needed`);
      });
      return;
    }
    
    console.log('✅ Enhanced database connection successful');
    
    // Initialize database tables using the old connection for compatibility
    try {
      const { initializeTables } = require('./db/connection');
      await initializeTables();
      console.log('✅ Database tables initialized');
    } catch (error) {
      console.log('⚠️ Database table initialization failed, but server will continue');
      console.log('💡 Tables will be created when first accessed');
    }
    
    // Start server with Socket.IO support
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Database health: http://localhost:${PORT}/health/db`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
      console.log(`⚡ Socket.IO enabled for real-time updates`);
      console.log(`🔄 Circuit breaker reset: POST http://localhost:${PORT}/health/reset-circuit-breaker`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('🔄 Starting server in limited mode due to error...');
    
    // Start server in limited mode even if there's an error
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (ERROR RECOVERY MODE)`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
      console.log(`⚡ Socket.IO enabled for real-time updates`);
      console.log(`⚠️ Database features disabled due to error`);
    });
  }
};

// Enhanced graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
  
  try {
    // Close the HTTP server
    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          console.log('✅ HTTP server closed');
          resolve();
        });
      });
    }
    
    // Close enhanced database connections
    try {
      await closePool();
      console.log('✅ Enhanced database pool closed');
    } catch (error) {
      console.error('⚠️ Error closing enhanced database pool:', error.message);
    }
    
    // Close old database connections for compatibility
    try {
      const { pool } = require('./db/connection');
      if (pool) {
        await pool.end();
        console.log('✅ Legacy database connections closed');
      }
    } catch (error) {
      console.error('⚠️ Error closing legacy database pool:', error.message);
    }
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
};

// Enhanced global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { 
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
  // Don't exit the process, just log the error and continue
  // This prevents crashes from unhandled promise rejections
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { 
    error: error.message,
    stack: error.stack
  });
  // For uncaught exceptions, we should exit gracefully
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle warnings
process.on('warning', (warning) => {
  logger.warn('Process Warning', { 
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  });
});

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start the server
startServer();