const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Basic CORS configuration
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Basic API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Practical Portal API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      profile: '/api/profile',
      batches: '/api/batches',
      submissions: '/api/submissions',
      dashboard: '/api/dashboard',
      upload: '/api/upload',
      announcements: '/api/announcements',
      notifications: '/api/notifications',
      health: '/health'
    }
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      basic: '/health',
      database: '/health/db',
      diagnose: '/health/db/diagnose',
      basicTest: '/health/db/basic',
      socketTest: '/health/db/sockettest',
      sslTest: '/health/db/ssl',
      envInfo: '/health/env',
      comprehensive: '/health/db/comprehensive',
      resetCircuitBreaker: '/health/reset-circuit-breaker',
      apiInfo: '/api'
    }
  });
});

// Database health check (simulated)
app.get('/health/db', (req, res) => {
  res.json({
    success: true,
    message: 'Database is healthy (simulated)',
    timestamp: new Date().toISOString(),
    database: {
      healthy: true,
      responseTime: 50,
      result: [{ health_check: 1 }],
      timestamp: new Date().toISOString()
    }
  });
});

// Circuit breaker reset endpoint (GET method)
app.get('/health/reset-circuit-breaker', (req, res) => {
  res.json({
    success: true,
    message: 'Circuit breaker reset successfully',
    timestamp: new Date().toISOString(),
    method: 'GET'
  });
});

// Circuit breaker reset endpoint (POST method)
app.post('/health/reset-circuit-breaker', (req, res) => {
  res.json({
    success: true,
    message: 'Circuit breaker reset successfully',
    timestamp: new Date().toISOString(),
    method: 'POST'
  });
});

// Additional health endpoints for testing
app.get('/health/db/diagnose', (req, res) => {
  res.json({
    success: true,
    message: 'Database diagnostics (simulated)',
    timestamp: new Date().toISOString(),
    diagnostics: {
      connection: 'OK',
      pool: 'OK',
      queries: 'OK'
    }
  });
});

app.get('/health/db/basic', (req, res) => {
  res.json({
    success: true,
    message: 'Basic database test (simulated)',
    timestamp: new Date().toISOString(),
    test: 'PASSED'
  });
});

app.get('/health/db/sockettest', (req, res) => {
  res.json({
    success: true,
    message: 'Socket connectivity test (simulated)',
    timestamp: new Date().toISOString(),
    socket: 'OK'
  });
});

app.get('/health/db/ssl', (req, res) => {
  res.json({
    success: true,
    message: 'SSL connection test (simulated)',
    timestamp: new Date().toISOString(),
    ssl: 'OK'
  });
});

app.get('/health/env', (req, res) => {
  res.json({
    success: true,
    message: 'Environment variables (simulated)',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: 'development',
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: '3306'
    }
  });
});

app.get('/health/db/comprehensive', (req, res) => {
  res.json({
    success: true,
    message: 'Comprehensive database analysis (simulated)',
    timestamp: new Date().toISOString(),
    analysis: {
      connection: 'OK',
      performance: 'OK',
      queries: 'OK',
      pool: 'OK'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API info: http://localhost:${PORT}/api`);
  console.log(`🔄 Circuit breaker reset: http://localhost:${PORT}/health/reset-circuit-breaker`);
  console.log(`💾 Database health: http://localhost:${PORT}/health/db`);
});
