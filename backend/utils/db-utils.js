const { pool, safeQuery } = require('../db/connection');

/**
 * Database utility functions for safe query execution
 * Provides error handling and connection management
 */

/**
 * Execute a query with automatic retry on connection limit errors
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise} Query results
 */
const executeWithRetry = async (query, params = [], maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await safeQuery(query, params);
    } catch (error) {
      lastError = error;
      
      // Check if it's a connection limit error
      if (error.code === 'ER_USER_LIMIT_REACHED' || error.errno === 1226) {
        console.warn(`⚠️ Connection limit reached (attempt ${attempt}/${maxRetries}). Retrying...`);
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        continue;
      }
      
      // For other errors, don't retry
      throw error;
    }
  }
  
  // If all retries failed
  console.error(`❌ Query failed after ${maxRetries} attempts:`, lastError.message);
  throw lastError;
};

/**
 * Get user profile with retry logic
 * @param {number} userId - User ID
 * @returns {Promise} User profile data
 */
const getUserProfile = async (userId) => {
  const query = `
    SELECT u.user_id, u.name, u.email, u.role, u.created_at,
           tp.college_name, tp.profile_picture_url as teacher_profile_picture,
           sp.year, sp.subject, sp.batch_name, sp.profile_picture_url as student_profile_picture
    FROM users u
    LEFT JOIN teacher_profiles tp ON u.user_id = tp.user_id
    LEFT JOIN student_profiles sp ON u.user_id = sp.user_id
    WHERE u.user_id = ?
  `;
  
  return await executeWithRetry(query, [userId]);
};

/**
 * Get teacher notifications with retry logic
 * @param {number} teacherId - Teacher ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise} Notifications data
 */
const getTeacherNotifications = async (teacherId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM notifications n
    WHERE n.teacher_id = ?
  `;
  const countResult = await executeWithRetry(countQuery, [teacherId]);
  const total = countResult[0].total;
  
  // Get notifications
  const notificationsQuery = `
    SELECT n.notification_id, n.type, n.title, n.message, n.is_read, n.created_at,
           s.name as student_name, s.email as student_email,
           b.name as batch_name
    FROM notifications n
    LEFT JOIN users s ON n.student_id = s.user_id
    LEFT JOIN batches b ON n.batch_id = b.batch_id
    WHERE n.teacher_id = ?
    ORDER BY n.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const notifications = await executeWithRetry(notificationsQuery, [teacherId, limit, offset]);
  
  return {
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Get batch submissions with retry logic
 * @param {number} batchId - Batch ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise} Submissions data
 */
const getBatchSubmissions = async (batchId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  
  const query = `
    SELECT s.submission_id, s.practical_name, s.content, s.file_url, s.code_sandbox_link, 
           s.status, s.created_at, s.updated_at,
           u.name as student_name, u.email as student_email,
           u.user_id as student_id
    FROM submissions s
    JOIN users u ON s.student_id = u.user_id
    WHERE s.batch_id = ?
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  return await executeWithRetry(query, [batchId, limit, offset]);
};

/**
 * Check database connection health
 * @returns {Promise<boolean>} Connection health status
 */
const checkConnectionHealth = async () => {
  try {
    await safeQuery('SELECT 1 as health_check');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
};

/**
 * Get connection pool statistics
 * @returns {Object} Pool statistics
 */
const getPoolStats = () => {
  return {
    totalConnections: pool.pool._allConnections.length,
    freeConnections: pool.pool._freeConnections.length,
    acquiringConnections: pool.pool._acquiringConnections.length,
    queuedRequests: pool.pool._connectionQueue.length
  };
};

module.exports = {
  executeWithRetry,
  getUserProfile,
  getTeacherNotifications,
  getBatchSubmissions,
  checkConnectionHealth,
  getPoolStats
};
