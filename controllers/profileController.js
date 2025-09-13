const { executeQuery, isDatabaseAvailable, executeTransaction } = require('../utils/enhanced-db-connection');
const { getUserProfile } = require('../utils/db-utils');

/**
 * Profile Controller
 * Handles user profile operations for both teachers and students
 * Manages profile data retrieval and updates
 */

/**
 * Get user profile by user ID
 * Returns different profile data based on user role
 */
const getProfile = async (req, res) => {
  try {
    const { userId, role } = req.user; // From JWT middleware

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again later.',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    // Get user profile with retry logic
    const users = await getUserProfile(userId);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Get role-specific profile data using robust connection
    let profileData = {};
    if (role === 'teacher') {
      const teacherProfile = await executeQuery(
        'SELECT college_name, profile_picture_url, contact_number FROM teacher_profiles WHERE user_id = ?',
        [userId]
      );
      profileData = teacherProfile?.[0] || {};
    } else {
      const studentProfile = await executeQuery(
        'SELECT year, subject, batch_name, roll_number, profile_picture_url FROM student_profiles WHERE user_id = ?',
        [userId]
      );
      profileData = studentProfile?.[0] || {};
    }

    // Ensure profile picture URL is properly handled
    if (profileData.profile_picture_url) {
      // If it's a base64 image, keep it as is
      // If it's a URL, keep it as is
      profileData.profilePictureUrl = profileData.profile_picture_url;
    } else if (user.photo_url) {
      // Fallback to Firebase photo URL if no profile picture is set
      profileData.profilePictureUrl = user.photo_url;
    }

    // Remove the old field name to avoid confusion
    delete profileData.profile_picture_url;

    res.json({
      success: true,
      data: {
        ...user,
        ...profileData
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    
    // Handle specific database errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again in a moment.',
        retryAfter: 30
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create or update user profile
 * Creates profile if it doesn't exist, updates if it does
 */
const createOrUpdateProfile = async (req, res) => {
  try {
    const { userId, role } = req.user; // From JWT middleware
    const updates = req.body;

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again later.',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    // Use enhanced database connection with transaction
    const queries = [];
    
    // Update basic user information if provided (email is not editable)
    if (updates.name) {
      queries.push({
        query: 'UPDATE users SET name = ? WHERE user_id = ?',
        params: [updates.name, userId]
      });
    }

    // Check if role-specific profile exists
    let profileExists = false;
    if (role === 'teacher') {
      const existingProfile = await executeQuery(
        'SELECT user_id FROM teacher_profiles WHERE user_id = ?',
        [userId]
      );
      profileExists = existingProfile.length > 0;
    } else {
      const existingProfile = await executeQuery(
        'SELECT user_id FROM student_profiles WHERE user_id = ?',
        [userId]
      );
      profileExists = existingProfile.length > 0;
    }

    // Handle role-specific profile data
    if (role === 'teacher') {
      const teacherUpdateFields = [];
      const teacherUpdateValues = [];

      if (updates.collegeName !== undefined) {
        teacherUpdateFields.push('college_name = ?');
        teacherUpdateValues.push(updates.collegeName);
      }
      if (updates.contactNumber !== undefined) {
        teacherUpdateFields.push('contact_number = ?');
        teacherUpdateValues.push(updates.contactNumber);
      }
      if (updates.profilePictureUrl !== undefined) {
        teacherUpdateFields.push('profile_picture_url = ?');
        teacherUpdateValues.push(updates.profilePictureUrl);
      }

      if (teacherUpdateFields.length > 0) {
        teacherUpdateValues.push(userId);
        
        if (profileExists) {
          // Update existing profile
          queries.push({
            query: `UPDATE teacher_profiles SET ${teacherUpdateFields.join(', ')} WHERE user_id = ?`,
            params: teacherUpdateValues
          });
        } else {
          // Create new profile
          queries.push({
            query: `INSERT INTO teacher_profiles (user_id, ${teacherUpdateFields.map(field => field.split(' = ')[0]).join(', ')}) VALUES (?, ${teacherUpdateValues.map(() => '?').join(', ')})`,
            params: [userId, ...teacherUpdateValues]
          });
        }
      }
    } else {
      const studentUpdateFields = [];
      const studentUpdateValues = [];

      if (updates.year !== undefined) {
        studentUpdateFields.push('year = ?');
        studentUpdateValues.push(updates.year);
      }
      if (updates.subject !== undefined) {
        studentUpdateFields.push('subject = ?');
        studentUpdateValues.push(updates.subject);
      }
      if (updates.batchName !== undefined) {
        studentUpdateFields.push('batch_name = ?');
        studentUpdateValues.push(updates.batchName);
      }
      if (updates.rollNumber !== undefined) {
        studentUpdateFields.push('roll_number = ?');
        studentUpdateValues.push(updates.rollNumber);
      }
      if (updates.profilePictureUrl !== undefined) {
        studentUpdateFields.push('profile_picture_url = ?');
        studentUpdateValues.push(updates.profilePictureUrl);
      }

      if (studentUpdateFields.length > 0) {
        studentUpdateValues.push(userId);
        
        if (profileExists) {
          // Update existing profile
          queries.push({
            query: `UPDATE student_profiles SET ${studentUpdateFields.join(', ')} WHERE user_id = ?`,
            params: studentUpdateValues
          });
        } else {
          // Create new profile
          queries.push({
            query: `INSERT INTO student_profiles (user_id, ${studentUpdateFields.map(field => field.split(' = ')[0]).join(', ')}) VALUES (?, ${studentUpdateValues.map(() => '?').join(', ')})`,
            params: [userId, ...studentUpdateValues]
          });
        }
      }
    }

    // Execute all queries in a transaction
    if (queries.length > 0) {
      await executeTransaction(queries);
    }

    res.json({
      success: true,
      message: profileExists ? 'Profile updated successfully' : 'Profile created successfully'
    });

  } catch (error) {
    console.error('Create/Update profile error:', error);
    
    // Handle specific database errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again in a moment.',
        retryAfter: 30
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user profile (legacy function for backward compatibility)
 * Updates both user table and role-specific profile table
 */
const updateProfile = async (req, res) => {
  // Redirect to createOrUpdateProfile for consistency
  return createOrUpdateProfile(req, res);
};

module.exports = {
  getProfile,
  updateProfile,
  createOrUpdateProfile
};
