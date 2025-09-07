const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
require('dotenv').config();

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
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(envVar => {
      console.error(`   - ${envVar} (or ${envVar.replace('DB_', 'DATABASE_')})`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    console.error('💡 You can use either the new format (DB_*) or old format (DATABASE_*)');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
};

// Validate environment variables before proceeding
validateEnvironment();

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

// Configure CORS to allow both localhost and Vercel deployment
const allowedOrigins = [
  'http://localhost:3000',
  'https://practicalportal.vercel.app',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN
].filter(Boolean); // Remove any undefined values

const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Use the same allowed origins as main CORS
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const PORT = process.env.PORT || 5000;

// Security middleware (applied first)
app.use(setSecurityHeaders);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use('/api', apiRateLimit);

// Input sanitization for all routes
app.use(sanitizeInput);

// Health check endpoint
app.get('/health', async (req, res) => {
  const { checkConnectionHealth, getPoolStats } = require('./utils/db-utils');
  
  try {
    const dbHealthy = await checkConnectionHealth();
    const poolStats = getPoolStats();
    
    res.json({
      success: true,
      message: 'Practical Portal API is running',
      timestamp: new Date().toISOString(),
      database: {
        healthy: dbHealthy,
        poolStats: poolStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Make Socket.IO instance available to routes
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);

// Socket.IO connection handling for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join batch room for real-time updates
  socket.on('joinBatch', (batchId) => {
    socket.join(`batch_${batchId}`);
    console.log(`User ${socket.id} joined batch ${batchId}`);
  });

  // Leave batch room
  socket.on('leaveBatch', (batchId) => {
    socket.leave(`batch_${batchId}`);
    console.log(`User ${socket.id} left batch ${batchId}`);
  });

  // Join teacher notification room
  socket.on('join_teacher_notifications', (teacherId) => {
    socket.join(`teacher_notifications_${teacherId}`);
    console.log(`User ${socket.id} joined teacher notifications for ${teacherId}`);
  });

  // Leave teacher notification room
  socket.on('leave_teacher_notifications', (teacherId) => {
    socket.leave(`teacher_notifications_${teacherId}`);
    console.log(`User ${socket.id} left teacher notifications for ${teacherId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make Socket.IO instance available globally for announcement events
global.io = io;

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
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
 * Initialize and start server
 * Tests database connection and creates tables before starting
 */
const startServer = async () => {
  try {
    // Initialize database with connection cleanup
    const dbInitialized = await initializeDatabaseWithCleanup();
    
    if (!dbInitialized) {
      console.error('❌ Database initialization failed.');
      console.log('🔄 Starting server in fallback mode (limited functionality)...');
      console.log('💡 Database features will be unavailable until connections are freed');
      
      // Start server anyway in fallback mode
      server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} (FALLBACK MODE)`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
        console.log(`⚡ Socket.IO enabled for real-time updates`);
        console.log(`⚠️ Database features disabled due to connection limit`);
      });
      return;
    }
    
    // Test database connection
    await testConnection();
    
    // Initialize database tables
    await initializeTables();
    
    // Start server with Socket.IO support
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
      console.log(`⚡ Socket.IO enabled for real-time updates`);
      
      // Start connection monitoring
      monitorConnections();
      console.log(`🔍 Connection monitoring enabled`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
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
    
    // Close database connections
    const { pool } = require('./db/connection');
    if (pool) {
      await pool.end();
      console.log('✅ Database connections closed');
    }
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start the server
startServer();