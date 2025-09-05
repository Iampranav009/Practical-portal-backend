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
  const requiredEnvVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_USER', 
    'DB_PASSWORD',
    'DB_NAME'
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(envVar => {
      console.error(`   - ${envVar}`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
};

// Validate environment variables before proceeding
validateEnvironment();

const { testConnection, initializeTables } = require('./db/connection');
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
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000',
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
  origin: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use('/api', apiRateLimit);

// Input sanitization for all routes
app.use(sanitizeInput);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Practical Portal API is running',
    timestamp: new Date().toISOString()
  });
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
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

// Start the server
startServer();
