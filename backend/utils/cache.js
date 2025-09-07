/**
 * Caching Utility for Practical Portal Backend
 * Provides in-memory caching with Redis support for future scaling
 * Designed to reduce database load and improve response times
 */

const NodeCache = require('node-cache');

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Don't clone objects for better performance
  deleteOnExpire: true, // Automatically delete expired keys
  maxKeys: 1000 // Maximum number of keys in cache
};

/**
 * Cache instance
 */
let cache = null;

/**
 * Initialize cache
 */
const initializeCache = () => {
  if (!cache) {
    cache = new NodeCache(CACHE_CONFIG);
    console.log('✅ In-memory cache initialized');
  }
  return cache;
};

/**
 * Get cache instance
 */
const getCache = () => {
  if (!cache) {
    return initializeCache();
  }
  return cache;
};

/**
 * Cache key generators for different data types
 */
const CacheKeys = {
  // User data
  user: (userId) => `user:${userId}`,
  userProfile: (userId) => `user_profile:${userId}`,
  
  // Batch data
  batch: (batchId) => `batch:${batchId}`,
  batchMembers: (batchId) => `batch_members:${batchId}`,
  teacherBatches: (teacherId) => `teacher_batches:${teacherId}`,
  studentBatches: (studentId) => `student_batches:${studentId}`,
  
  // Submission data
  batchSubmissions: (batchId) => `batch_submissions:${batchId}`,
  studentSubmissions: (studentId) => `student_submissions:${studentId}`,
  submission: (submissionId) => `submission:${submissionId}`,
  
  // Notification data
  teacherNotifications: (teacherId) => `teacher_notifications:${teacherId}`,
  unreadCount: (teacherId) => `unread_count:${teacherId}`,
  
  // Announcement data
  batchAnnouncements: (batchId) => `batch_announcements:${batchId}`,
  announcementUnreadCount: (batchId, studentId) => `announcement_unread:${batchId}:${studentId}`,
  
  // Dashboard data
  teacherAnalytics: (teacherId) => `teacher_analytics:${teacherId}`,
  batchStats: (batchId) => `batch_stats:${batchId}`
};

/**
 * Cache operations
 */
const CacheOperations = {
  /**
   * Get value from cache
   */
  get: (key) => {
    try {
      const cache = getCache();
      return cache.get(key);
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  },

  /**
   * Set value in cache
   */
  set: (key, value, ttl = null) => {
    try {
      const cache = getCache();
      if (ttl) {
        cache.set(key, value, ttl);
      } else {
        cache.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  },

  /**
   * Delete value from cache
   */
  del: (key) => {
    try {
      const cache = getCache();
      return cache.del(key);
    } catch (error) {
      console.error('Cache delete error:', error.message);
      return false;
    }
  },

  /**
   * Delete multiple keys
   */
  delMultiple: (keys) => {
    try {
      const cache = getCache();
      return cache.del(keys);
    } catch (error) {
      console.error('Cache delete multiple error:', error.message);
      return false;
    }
  },

  /**
   * Check if key exists
   */
  has: (key) => {
    try {
      const cache = getCache();
      return cache.has(key);
    } catch (error) {
      console.error('Cache has error:', error.message);
      return false;
    }
  },

  /**
   * Get cache statistics
   */
  getStats: () => {
    try {
      const cache = getCache();
      return cache.getStats();
    } catch (error) {
      console.error('Cache stats error:', error.message);
      return null;
    }
  },

  /**
   * Clear all cache
   */
  flush: () => {
    try {
      const cache = getCache();
      cache.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error.message);
      return false;
    }
  }
};

/**
 * Cache wrapper for database queries
 */
const withCache = async (key, queryFn, ttl = null) => {
  try {
    // Try to get from cache first
    const cached = CacheOperations.get(key);
    if (cached !== undefined) {
      console.log(`📦 Cache hit: ${key}`);
      return cached;
    }

    // If not in cache, execute query
    console.log(`🔍 Cache miss: ${key}`);
    const result = await queryFn();
    
    // Store in cache
    if (result !== null && result !== undefined) {
      CacheOperations.set(key, result, ttl);
      console.log(`💾 Cached: ${key}`);
    }
    
    return result;
  } catch (error) {
    console.error('Cache wrapper error:', error.message);
    // If cache fails, still try to execute query
    return await queryFn();
  }
};

/**
 * Invalidate cache patterns
 */
const invalidatePattern = (pattern) => {
  try {
    const cache = getCache();
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    if (matchingKeys.length > 0) {
      CacheOperations.delMultiple(matchingKeys);
      console.log(`🗑️ Invalidated ${matchingKeys.length} keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error.message);
  }
};

/**
 * Cache invalidation helpers
 */
const CacheInvalidation = {
  // User data
  invalidateUser: (userId) => {
    invalidatePattern(`user:${userId}`);
    invalidatePattern(`user_profile:${userId}`);
  },

  // Batch data
  invalidateBatch: (batchId) => {
    invalidatePattern(`batch:${batchId}`);
    invalidatePattern(`batch_members:${batchId}`);
    invalidatePattern(`batch_submissions:${batchId}`);
    invalidatePattern(`batch_announcements:${batchId}`);
    invalidatePattern(`batch_stats:${batchId}`);
  },

  // Teacher data
  invalidateTeacher: (teacherId) => {
    invalidatePattern(`teacher:${teacherId}`);
    invalidatePattern(`teacher_batches:${teacherId}`);
    invalidatePattern(`teacher_notifications:${teacherId}`);
    invalidatePattern(`teacher_analytics:${teacherId}`);
  },

  // Student data
  invalidateStudent: (studentId) => {
    invalidatePattern(`student:${studentId}`);
    invalidatePattern(`student_batches:${studentId}`);
    invalidatePattern(`student_submissions:${studentId}`);
  },

  // Submission data
  invalidateSubmission: (submissionId) => {
    invalidatePattern(`submission:${submissionId}`);
    // Also invalidate batch submissions cache
    invalidatePattern('batch_submissions:');
  },

  // Notification data
  invalidateNotifications: (teacherId) => {
    invalidatePattern(`teacher_notifications:${teacherId}`);
    invalidatePattern(`unread_count:${teacherId}`);
  }
};

/**
 * Cache middleware for Express routes
 */
const cacheMiddleware = (keyGenerator, ttl = null) => {
  return (req, res, next) => {
    const key = keyGenerator(req);
    
    // Try to get from cache
    const cached = CacheOperations.get(key);
    if (cached !== undefined) {
      console.log(`📦 Cache hit for route: ${req.url}`);
      return res.json(cached);
    }

    // Store original res.json
    const originalJson = res.json;
    
    // Override res.json to cache the response
    res.json = function(data) {
      // Cache the response
      if (data && data.success !== false) {
        CacheOperations.set(key, data, ttl);
        console.log(`💾 Cached response for route: ${req.url}`);
      }
      
      // Call original res.json
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Initialize cache on module load
 */
initializeCache();

module.exports = {
  CacheKeys,
  CacheOperations,
  withCache,
  invalidatePattern,
  CacheInvalidation,
  cacheMiddleware,
  getCache
};
