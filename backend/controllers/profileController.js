const { pool } = require('../db/connection');

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

    // Get basic user information
    const [users] = await pool.execute(
      'SELECT user_id, name, email, role FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Get role-specific profile data
    let profileData = {};
    if (role === 'teacher') {
      const [teacherProfile] = await pool.execute(
        'SELECT college_name, profile_picture_url, contact_number FROM teacher_profiles WHERE user_id = ?',
        [userId]
      );
      profileData = teacherProfile[0] || {};
    } else {
      const [studentProfile] = await pool.execute(
        'SELECT year, subject, batch_name, roll_number, profile_picture_url FROM student_profiles WHERE user_id = ?',
        [userId]
      );
      profileData = studentProfile[0] || {};
    }

    res.json({
      success: true,
      data: {
        ...user,
        ...profileData
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user profile
 * Updates both user table and role-specific profile table
 */
const updateProfile = async (req, res) => {
  try {
    const { userId, role } = req.user; // From JWT middleware
    const updates = req.body;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update basic user information if provided (email is not editable)
      if (updates.name) {
        await connection.execute(
          'UPDATE users SET name = ? WHERE user_id = ?',
          [updates.name, userId]
        );
      }

      // Update role-specific profile data
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
          await connection.execute(
            `UPDATE teacher_profiles SET ${teacherUpdateFields.join(', ')} WHERE user_id = ?`,
            teacherUpdateValues
          );
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
          await connection.execute(
            `UPDATE student_profiles SET ${studentUpdateFields.join(', ')} WHERE user_id = ?`,
            studentUpdateValues
          );
        }
      }

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
