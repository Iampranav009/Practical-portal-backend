const {
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
} = require('./enhanced-db-connection');

/**
 * Unified database facade for the entire backend.
 * This is the single source of truth for all DB access.
 *
 * Notes:
 * - Provides a compatibility `pool.execute(sql, params)` to support legacy callers while we migrate.
 * - Internally routes all queries through `executeQuery` which includes retries and timeouts.
 * - Includes health and lifecycle helpers for graceful shutdown.
 */

const pool = {
  // Compatibility layer: mimic mysql2's pool.execute returning [rows]
  async execute(sql, params = []) {
    const rows = await executeQuery(sql, params);
    return [rows];
  }
};

module.exports = {
  // Primary API
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
  testSSLConnection,
  // Legacy compatibility
  pool
};


