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
  connectionLimit: 10,
  queueLimit: 0,
  // Enhanced connection configuration for better reliability
  reconnect: true,
  acquireTimeout: 60000,
  timeout: 60000,
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
        profile_picture_url VARCHAR(500),
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
        profile_picture_url VARCHAR(500),
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
        profile_image VARCHAR(500),
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

    await pool.execute(createUsersTable);
    await pool.execute(createTeacherProfilesTable);
    await pool.execute(createStudentProfilesTable);
    await pool.execute(createBatchesTable);
    await pool.execute(createBatchMembersTable);
    await pool.execute(createSubmissionsTable);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database tables:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  initializeTables
};
