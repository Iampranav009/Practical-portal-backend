const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * MySQL Database Connection Pool
 * Creates a connection pool for efficient database operations
 * Uses environment variables for configuration
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
  user: process.env.DB_USER || process.env.DATABASE_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
  database: process.env.DB_NAME || process.env.DATABASE_NAME || 'practical_portal',
  waitForConnections: true,
  connectionLimit: 5, // Reduced from 10 to 5 to stay well under the 50 limit
  queueLimit: 0,
  // Connection cleanup settings
  idleTimeout: 300000, // 5 minutes
  maxIdle: 2, // Maximum idle connections
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Test database connection with retry logic
 * Verifies that the database is accessible with multiple attempts
 */
const testConnection = async (retries = 5, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log('✅ MySQL Database connected successfully');
      connection.release();
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1}/${retries} failed:`, error.message);
      
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed. Exiting...');
        process.exit(1);
      }
      
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Monitor connection pool status
 * Logs connection pool statistics for debugging
 */
const monitorConnections = () => {
  setInterval(() => {
    try {
      const poolStats = {
        totalConnections: pool.pool?._allConnections?.length || 0,
        freeConnections: pool.pool?._freeConnections?.length || 0,
        acquiringConnections: pool.pool?._acquiringConnections?.length || 0,
        queuedRequests: pool.pool?._connectionQueue?.length || 0
      };
      
      console.log('📊 Connection Pool Stats:', poolStats);
      
      // Warn if approaching connection limit
      if (poolStats.totalConnections > 3) {
        console.warn('⚠️ High connection usage detected:', poolStats);
      }
    } catch (error) {
      console.log('📊 Connection monitoring temporarily unavailable:', error.message);
    }
  }, 30000); // Check every 30 seconds
};

/**
 * Safe database query wrapper with automatic connection management
 * Ensures connections are properly released even on errors
 */
const safeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Safe database query wrapper for multiple queries
 * Executes multiple queries in a transaction with proper connection management
 */
const safeTransaction = async (queries) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params = [] } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Database transaction error:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Initialize database tables
 * Creates necessary tables if they don't exist
 */
const initializeTables = async () => {
  try {
    // Users table for storing user authentication and profile data
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        photo_url VARCHAR(500) DEFAULT NULL,
        role ENUM('student', 'teacher') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    // Teacher profiles table for additional teacher-specific data
    const createTeacherProfilesTable = `
      CREATE TABLE IF NOT EXISTS teacher_profiles (
        profile_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        college_name VARCHAR(255),
        employee_id VARCHAR(50) DEFAULT NULL,
        contact_number VARCHAR(20) DEFAULT NULL,
        profile_picture_url LONGTEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `;

    // Student profiles table for additional student-specific data
    const createStudentProfilesTable = `
      CREATE TABLE IF NOT EXISTS student_profiles (
        profile_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        year VARCHAR(50),
        subject VARCHAR(255),
        batch_name VARCHAR(100),
        roll_number VARCHAR(50) DEFAULT NULL,
        profile_picture_url LONGTEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `;

    // Batches table for storing classroom/batch information
    const createBatchesTable = `
      CREATE TABLE IF NOT EXISTS batches (
        batch_id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        college_name VARCHAR(255) NOT NULL,
        description TEXT,
        password VARCHAR(255) NOT NULL,
        icon_image LONGTEXT DEFAULT NULL,
        cover_image LONGTEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `;

    // Batch members table for tracking student enrollment
    const createBatchMembersTable = `
      CREATE TABLE IF NOT EXISTS batch_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        student_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY unique_batch_student (batch_id, student_id)
      )
    `;

    // Submissions table for storing student submissions with status tracking
    const createSubmissionsTable = `
      CREATE TABLE IF NOT EXISTS submissions (
        submission_id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        student_id INT NOT NULL,
        practical_name VARCHAR(255) NOT NULL DEFAULT 'Untitled Practical',
        content TEXT NOT NULL,
        file_url VARCHAR(500) DEFAULT NULL,
        code_sandbox_link VARCHAR(500) DEFAULT NULL,
        code_language VARCHAR(50) DEFAULT NULL,
        status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_batch_submissions (batch_id),
        INDEX idx_student_submissions (student_id),
        INDEX idx_submission_status (status),
        INDEX idx_submissions_practical_name (practical_name)
      )
    `;

    // Create announcements table for batch announcements
    const createAnnouncementsTable = `
      CREATE TABLE IF NOT EXISTS announcements (
        announcement_id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        teacher_id INT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_announcements_batch_id (batch_id),
        INDEX idx_announcements_created_at (created_at)
      )
    `;

    // Create announcement_reads table to track which students have read announcements
    const createAnnouncementReadsTable = `
      CREATE TABLE IF NOT EXISTS announcement_reads (
        read_id INT AUTO_INCREMENT PRIMARY KEY,
        announcement_id INT NOT NULL,
        student_id INT NOT NULL,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (announcement_id) REFERENCES announcements(announcement_id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY unique_announcement_student (announcement_id, student_id),
        INDEX idx_announcement_reads_announcement_id (announcement_id),
        INDEX idx_announcement_reads_student_id (student_id)
      )
    `;

    // Create notifications table for teacher notifications
    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        student_id INT NOT NULL,
        batch_id INT NOT NULL,
        submission_id INT DEFAULT NULL,
        type ENUM('submission', 'announcement', 'batch_join') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE,
        FOREIGN KEY (submission_id) REFERENCES submissions(submission_id) ON DELETE CASCADE,
        INDEX idx_notifications_teacher_id (teacher_id),
        INDEX idx_notifications_created_at (created_at),
        INDEX idx_notifications_is_read (is_read),
        INDEX idx_notifications_type (type)
      )
    `;

    // Create notification settings table for email preferences
    const createNotificationSettingsTable = `
      CREATE TABLE IF NOT EXISTS notification_settings (
        setting_id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        email_notifications BOOLEAN DEFAULT TRUE,
        submission_notifications BOOLEAN DEFAULT TRUE,
        announcement_notifications BOOLEAN DEFAULT TRUE,
        batch_join_notifications BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY unique_teacher_settings (teacher_id)
      )
    `;

    await pool.execute(createUsersTable);
    await pool.execute(createTeacherProfilesTable);
    await pool.execute(createStudentProfilesTable);
    await pool.execute(createBatchesTable);
    await pool.execute(createBatchMembersTable);
    await pool.execute(createSubmissionsTable);
    await pool.execute(createAnnouncementsTable);
    await pool.execute(createAnnouncementReadsTable);
    await pool.execute(createNotificationsTable);
    await pool.execute(createNotificationSettingsTable);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database tables:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  initializeTables,
  monitorConnections,
  safeQuery,
  safeTransaction
};
