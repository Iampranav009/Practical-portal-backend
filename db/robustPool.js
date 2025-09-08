const mysql = require('mysql2/promise');
const retry = require('async-retry');
const net = require('net');
require('dotenv').config();

/**
 * Robust MySQL pool with socket pre-check, retries, backoff, and safe release.
 * Notes:
 * - Small default pool size to avoid exhausting Hostinger/Render connection limits.
 * - Timeouts can be temporarily extended via DEBUG_DB_TIMEOUT=true (feature flag).
 * - SSL is enabled in production; Hostinger supports TLS. We start with rejectUnauthorized:false.
 */

const DEBUG_DB_TIMEOUT = process.env.DEBUG_DB_TIMEOUT === 'true';

const resolveDbConfig = () => {
  const connectionLimit = parseInt(process.env.DB_POOL_LIMIT || process.env.DATABASE_POOL_LIMIT || '2');
  const host = process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || process.env.DATABASE_PORT || '3306');
  const user = process.env.DB_USER || process.env.DATABASE_USER || 'root';
  const password = process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '';
  const database = process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal';

  const connectTimeout = DEBUG_DB_TIMEOUT ? 20000 : 10000; // ms

  const ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;

  return {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
    connectTimeout,
    idleTimeout: 60000,
    maxIdle: 2,
    keepAliveInitialDelay: 0,
    enableKeepAlive: true,
    ssl,
    charset: 'utf8mb4',
    timezone: 'Z',
    supportBigNumbers: true,
    bigNumberStrings: true,
    namedPlaceholders: true,
    multipleStatements: false,
    typeCast: true,
    rowsAsArray: false
  };
};

let pool;

const getPool = () => {
  if (!pool) {
    const cfg = resolveDbConfig();
    // Minimal log (no secrets)
    console.log('DB pool init', { host: cfg.host, database: cfg.database, connectionLimit: cfg.connectionLimit, connectTimeout: cfg.connectTimeout });
    pool = mysql.createPool(cfg);
  }
  return pool;
};

const socketTest = (host, port, timeoutMs = 3000) => new Promise((resolve) => {
  const s = new net.Socket();
  s.setTimeout(timeoutMs);
  s.once('connect', () => { s.destroy(); resolve({ ok: true }); });
  s.once('timeout', () => { s.destroy(); resolve({ ok: false, code: 'ETIMEDOUT' }); });
  s.once('error', (e) => { resolve({ ok: false, code: e.code || 'EUNKNOWN', message: e.message }); });
  s.connect(port, host);
});

const getConnectionWithRetry = async () => {
  const cfg = resolveDbConfig();

  const sock = await socketTest(cfg.host, cfg.port, 3000);
  if (!sock.ok) {
    const err = new Error(`TCP socket check failed: ${sock.code || 'ERR'} ${sock.message || ''}`.trim());
    err.code = sock.code || 'SOCKET_CHECK_FAILED';
    throw err;
  }

  const poolRef = getPool();

  return retry(async (bail) => {
    try {
      const start = Date.now();
      const conn = await poolRef.getConnection();
      const dur = Date.now() - start;
      console.log('DB getConnection ok', { ms: dur });
      return conn;
    } catch (e) {
      // Non-retryable fatal errors
      if (['ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(e.code)) {
        return bail(e);
      }
      throw e;
    }
  }, { retries: 3, factor: 2, minTimeout: 500, maxTimeout: 4000 });
};

const query = async (sql, params = []) => {
  let conn;
  try {
    conn = await getConnectionWithRetry();
    const q = conn.execute(sql, params);
    const to = new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('Query timeout'), { code: 'ETIMEDOUT' })), DEBUG_DB_TIMEOUT ? 20000 : 10000));
    const [rows] = await Promise.race([q, to]);
    return rows;
  } finally {
    if (conn) {
      try { conn.release(); } catch (_) {}
    }
  }
};

module.exports = { getPool, getConnectionWithRetry, query };



