const { pool } = require('../db/connection');
const { executeQuery, isDatabaseAvailable } = require('../utils/enhanced-db-connection');
const jwt = require('jsonwebtoken');

/**
 * Authentication Controller
 * Handles user registration and profile creation after Firebase auth
 * Manages JWT token generation for backend API access
 */

/**
 * Register new user after Firebase authentication
 * Creates user record in MySQL database with role information
 */
const registerUser = async (req, res) => {
  try {
    const { firebaseUid, name, email, role, rollNumber, employeeId, photoURL } = req.body;

    // Validate required fields
    if (!firebaseUid || !name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: firebaseUid, name, email, role'
      });
    }

    // Validate role
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "student" or "teacher"'
      });
    }

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again later.',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    // Check if user already exists
    const existingUser = await executeQuery(
      'SELECT user_id FROM users WHERE firebase_uid = ? OR email = ?',
      [firebaseUid, email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Insert new user - handle undefined values by converting to null
    const result = await executeQuery(
      'INSERT INTO users (firebase_uid, name, email, role, photo_url) VALUES (?, ?, ?, ?, ?)',
      [firebaseUid, name, email, role, photoURL || null]
    );

    const userId = result.insertId;

    // Create role-specific profile table entry
    if (role === 'teacher') {
      await executeQuery(
        'INSERT INTO teacher_profiles (user_id, employee_id) VALUES (?, ?)',
        [userId, employeeId || null]
      );
    } else {
      await executeQuery(
        'INSERT INTO student_profiles (user_id, roll_number) VALUES (?, ?)',
        [userId, rollNumber || null]
      );
    }

    // Generate JWT token for backend API access
    const token = jwt.sign(
      { userId, firebaseUid, role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId,
        name,
        email,
        role,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Log specific error details for debugging
    if (error.code) {
      console.error('SQL Error Code:', error.code);
      console.error('SQL Error Message:', error.sqlMessage);
      console.error('SQL Query:', error.sql);
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Get user information by Firebase UID
 * Used for authentication verification and profile loading
 */
const getUserByFirebaseUid = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again later.',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    const users = await executeQuery(
      'SELECT user_id, firebase_uid, name, email, role, created_at FROM users WHERE firebase_uid = ?',
      [firebaseUid]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, firebaseUid: user.firebase_uid, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        ...user,
        token
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Handle Google Sign In
 * Creates or updates user record for Google authentication
 */
const googleSignIn = async (req, res) => {
  try {
    const { firebaseUid, name, email, role, photoURL } = req.body;

    // Validate required fields
    if (!firebaseUid || !name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: firebaseUid, name, email, role'
      });
    }

    // Validate role
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "student" or "teacher"'
      });
    }

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again later.',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    // Check if user already exists
    let existingUser = await executeQuery(
      'SELECT user_id, role FROM users WHERE firebase_uid = ?',
      [firebaseUid]
    );

    let userId;

    if (existingUser.length > 0) {
      // User exists, update profile if needed
      userId = existingUser[0].user_id;
      
      // Update user information
      await executeQuery(
        'UPDATE users SET name = ?, email = ?, photo_url = ? WHERE firebase_uid = ?',
        [name, email, photoURL || null, firebaseUid]
      );
    } else {
      // Create new user
      const result = await executeQuery(
        'INSERT INTO users (firebase_uid, name, email, role, photo_url) VALUES (?, ?, ?, ?, ?)',
        [firebaseUid, name, email, role, photoURL || null]
      );

      userId = result.insertId;

      // Create role-specific profile table entry
      if (role === 'teacher') {
        await executeQuery(
          'INSERT INTO teacher_profiles (user_id) VALUES (?)',
          [userId]
        );
      } else {
        await executeQuery(
          'INSERT INTO student_profiles (user_id) VALUES (?)',
          [userId]
        );
      }
    }

    // Generate JWT token for backend API access
    const token = jwt.sign(
      { userId, firebaseUid, role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    // Set auth token as HTTP-only cookie for security
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    res.json({
      success: true,
      message: 'Google sign in successful',
      data: {
        userId,
        name,
        email,
        role,
        token
      }
    });

  } catch (error) {
    console.error('Google sign in error:', error);
    
    // Log specific error details for debugging
    if (error.code) {
      console.error('SQL Error Code:', error.code);
      console.error('SQL Error Message:', error.sqlMessage);
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during Google sign in',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Handle regular email/password sign in
 * Verifies user credentials and role-specific data
 */
const emailSignIn = async (req, res) => {
  try {
    const { firebaseUid, email, role, rollNumber, employeeId } = req.body;

    // Validate required fields
    if (!firebaseUid || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID, email, and role are required'
      });
    }

    // Validate role-specific fields
    if (role === 'student' && !rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Roll number is required for students'
      });
    }

    if (role === 'teacher' && !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required for teachers'
      });
    }

    // Get user from database
    const [users] = await pool.execute(
      'SELECT user_id, firebase_uid, name, email, role FROM users WHERE firebase_uid = ? AND email = ?',
      [firebaseUid, email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    const user = users[0];

    // Verify role matches
    if (user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account is registered as ${user.role}, not ${role}`
      });
    }

    // Verify role-specific credentials
    if (role === 'student') {
      const [studentProfile] = await pool.execute(
        'SELECT roll_number FROM student_profiles WHERE user_id = ?',
        [user.user_id]
      );

      if (studentProfile.length > 0 && studentProfile[0].roll_number) {
        if (studentProfile[0].roll_number !== rollNumber) {
          return res.status(403).json({
            success: false,
            message: 'Invalid roll number'
          });
        }
      } else {
        // Update roll number if not set
        await pool.execute(
          'UPDATE student_profiles SET roll_number = ? WHERE user_id = ?',
          [rollNumber, user.user_id]
        );
      }
    }

    if (role === 'teacher') {
      const [teacherProfile] = await pool.execute(
        'SELECT employee_id FROM teacher_profiles WHERE user_id = ?',
        [user.user_id]
      );

      if (teacherProfile.length > 0 && teacherProfile[0].employee_id) {
        if (teacherProfile[0].employee_id !== employeeId) {
          return res.status(403).json({
            success: false,
            message: 'Invalid employee ID'
          });
        }
      } else {
        // Update employee ID if not set
        await pool.execute(
          'UPDATE teacher_profiles SET employee_id = ? WHERE user_id = ?',
          [employeeId, user.user_id]
        );
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, firebaseUid: user.firebase_uid, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    // Set auth token as HTTP-only cookie for security
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    res.json({
      success: true,
      message: 'Sign in successful',
      data: {
        ...user,
        token
      }
    });

  } catch (error) {
    console.error('Email sign in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during sign in'
    });
  }
};

/**
 * Handle user logout
 * Clears the authentication cookie
 */
const logout = async (req, res) => {
  try {
    // Clear the auth token cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
};

module.exports = {
  registerUser,
  getUserByFirebaseUid,
  googleSignIn,
  emailSignIn,
  logout
};
