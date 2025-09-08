const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// CORS middleware - MUST be applied before any other middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('🌐 Request origin:', origin);
  console.log('🌐 Request method:', req.method);
  console.log('🌐 Request URL:', req.url);
  
  // Allow all origins for testing
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  console.log('✅ CORS headers set for origin:', origin);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling preflight request for:', req.url);
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Practical Portal API is running (Simple Mode)',
    timestamp: new Date().toISOString(),
    cors: 'Enabled'
  });
});

// Test auth endpoint
app.get('/api/auth/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// Mock user endpoint
app.get('/api/auth/user/:firebaseUid', (req, res) => {
  const { firebaseUid } = req.params;
  console.log('🔐 Mock user endpoint hit for UID:', firebaseUid);
  res.json({
    success: true,
    message: 'User endpoint is working',
    firebaseUid: firebaseUid,
    timestamp: new Date().toISOString()
  });
});

// Mock register endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('🔐 Mock register endpoint hit');
  res.json({
    success: true,
    message: 'Register endpoint is working',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// Mock google signin endpoint
app.post('/api/auth/google-signin', (req, res) => {
  console.log('🔐 Mock Google signin endpoint hit');
  res.json({
    success: true,
    message: 'Google signin endpoint is working',
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    url: req.originalUrl
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 CORS test: http://localhost:${PORT}/cors-test`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
