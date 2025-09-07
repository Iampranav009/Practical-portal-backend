/**
 * Comprehensive Monitoring and Logging Utility
 * Provides centralized logging, monitoring, and alerting for the Practical Portal backend
 */

const fs = require('fs');
const path = require('path');

/**
 * Log levels for different types of messages
 */
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Log colors for console output
 */
const LOG_COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[37m', // White
  RESET: '\x1b[0m'   // Reset
};

/**
 * Monitoring metrics storage
 */
let metrics = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    rateLimited: 0
  },
  database: {
    queries: 0,
    successful: 0,
    failed: 0,
    timeouts: 0,
    avgResponseTime: 0
  },
  socket: {
    connections: 0,
    disconnections: 0,
    errors: 0
  },
  errors: {
    total: 0,
    byType: {},
    recent: []
  },
  uptime: {
    startTime: Date.now(),
    lastRestart: Date.now()
  }
};

/**
 * Enhanced logger with structured logging
 */
class Logger {
  constructor(service = 'PracticalPortal') {
    this.service = service;
    this.logDir = path.join(__dirname, '..', 'logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.service,
      message,
      meta,
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };

    return logEntry;
  }

  writeToFile(level, message, meta = {}) {
    try {
      const logEntry = this.formatMessage(level, message, meta);
      const logFile = path.join(this.logDir, `${level.toLowerCase()}.log`);
      const logLine = JSON.stringify(logEntry) + '\n';
      
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  log(level, message, meta = {}) {
    const color = LOG_COLORS[level] || LOG_COLORS.INFO;
    const reset = LOG_COLORS.RESET;
    
    // Console output with colors
    console.log(`${color}[${level}]${reset} ${message}`, meta && Object.keys(meta).length > 0 ? meta : '');
    
    // File output
    this.writeToFile(level, message, meta);
    
    // Update metrics
    this.updateMetrics(level, message, meta);
  }

  error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log(LOG_LEVELS.DEBUG, message, meta);
    }
  }

  updateMetrics(level, message, meta) {
    metrics.errors.total++;
    
    if (!metrics.errors.byType[level]) {
      metrics.errors.byType[level] = 0;
    }
    metrics.errors.byType[level]++;

    // Keep only last 100 errors
    metrics.errors.recent.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      meta
    });
    
    if (metrics.errors.recent.length > 100) {
      metrics.errors.recent.shift();
    }
  }
}

/**
 * Request monitoring middleware
 */
const requestMonitor = (req, res, next) => {
  const startTime = Date.now();
  
  metrics.requests.total++;
  
  // Log request
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    origin: req.get('Origin')
  });

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      metrics.requests.successful++;
    } else if (res.statusCode === 429) {
      metrics.requests.rateLimited++;
    } else {
      metrics.requests.failed++;
    }

    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });

    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Database monitoring wrapper
 */
const monitorDatabaseQuery = async (queryFn, query, params = []) => {
  const startTime = Date.now();
  
  try {
    metrics.database.queries++;
    const result = await queryFn(query, params);
    const duration = Date.now() - startTime;
    
    metrics.database.successful++;
    metrics.database.avgResponseTime = 
      (metrics.database.avgResponseTime + duration) / 2;
    
    logger.debug('Database query successful', {
      query: query.substring(0, 100) + '...',
      duration: `${duration}ms`,
      params: params.length
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    metrics.database.failed++;
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      metrics.database.timeouts++;
    }
    
    logger.error('Database query failed', {
      query: query.substring(0, 100) + '...',
      duration: `${duration}ms`,
      error: error.message,
      code: error.code
    });
    
    throw error;
  }
};

/**
 * Socket.IO monitoring
 */
const monitorSocketConnection = (socket) => {
  metrics.socket.connections++;
  
  logger.info('Socket.IO connection established', {
    socketId: socket.id,
    totalConnections: metrics.socket.connections
  });

  socket.on('disconnect', (reason) => {
    metrics.socket.disconnections++;
    
    logger.info('Socket.IO connection closed', {
      socketId: socket.id,
      reason,
      totalConnections: metrics.socket.connections - metrics.socket.disconnections
    });
  });

  socket.on('error', (error) => {
    metrics.socket.errors++;
    
    logger.error('Socket.IO error', {
      socketId: socket.id,
      error: error.message
    });
  });
};

/**
 * Get current metrics
 */
const getMetrics = () => {
  return {
    ...metrics,
    uptime: {
      ...metrics.uptime,
      current: Date.now() - metrics.uptime.startTime
    },
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: new Date().toISOString()
  };
};

/**
 * Reset metrics (useful for testing)
 */
const resetMetrics = () => {
  metrics = {
    requests: {
      total: 0,
      successful: 0,
      failed: 0,
      rateLimited: 0
    },
    database: {
      queries: 0,
      successful: 0,
      failed: 0,
      timeouts: 0,
      avgResponseTime: 0
    },
    socket: {
      connections: 0,
      disconnections: 0,
      errors: 0
    },
    errors: {
      total: 0,
      byType: {},
      recent: []
    },
    uptime: {
      startTime: Date.now(),
      lastRestart: Date.now()
    }
  };
};

/**
 * Health check with detailed metrics
 */
const getHealthStatus = () => {
  const dbHealth = metrics.database.queries > 0 ? 
    (metrics.database.successful / metrics.database.queries) : 1;
  
  const requestHealth = metrics.requests.total > 0 ? 
    (metrics.requests.successful / metrics.requests.total) : 1;
  
  const errorRate = metrics.errors.total / (metrics.requests.total || 1);
  
  return {
    status: errorRate < 0.1 && dbHealth > 0.8 ? 'healthy' : 'degraded',
    metrics: getMetrics(),
    health: {
      database: {
        status: dbHealth > 0.8 ? 'healthy' : 'degraded',
        successRate: dbHealth,
        avgResponseTime: metrics.database.avgResponseTime
      },
      requests: {
        status: requestHealth > 0.9 ? 'healthy' : 'degraded',
        successRate: requestHealth,
        total: metrics.requests.total
      },
      errors: {
        status: errorRate < 0.1 ? 'healthy' : 'degraded',
        rate: errorRate,
        total: metrics.errors.total
      }
    }
  };
};

/**
 * Create logger instance
 */
const logger = new Logger();

module.exports = {
  Logger,
  logger,
  requestMonitor,
  monitorDatabaseQuery,
  monitorSocketConnection,
  getMetrics,
  resetMetrics,
  getHealthStatus,
  LOG_LEVELS
};
