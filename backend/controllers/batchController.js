const { pool } = require('../db/connection');
const bcrypt = require('bcryptjs');

/**
 * Batch Controller
 * Handles batch/classroom management operations
 * Manages batch creation, editing, deletion, joining, and member operations
 */

/**
 * Create a new batch
 * Teacher-only operation
 */
const createBatch = async (req, res) => {
  try {
    const { userId, role } = req.user; // From JWT middleware
    const { name, collegeName, description, password, iconImage, coverImage } = req.body;

    // Validate teacher role
    if (role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can create batches'
      });
    }

    // Validate required fields
    if (!name || !collegeName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, college name, and password are required'
      });
    }

    // Hash the batch password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new batch into database with both icon and cover images
    const [result] = await pool.execute(
      'INSERT INTO batches (teacher_id, name, college_name, description, password, icon_image, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, collegeName, description || '', hashedPassword, iconImage || '', coverImage || '']
    );

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: {
        batchId: result.insertId,
        name,
        collegeName,
        description
      }
    });

  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all batches created by a teacher
 * Teacher-only operation
 */
const getTeacherBatches = async (req, res) => {
  try {
    const { userId, role } = req.user;

    // Validate teacher role
    if (role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can view their batches'
      });
    }

    // Get all batches created by this teacher with member count
    const [batches] = await pool.execute(`
      SELECT 
        b.batch_id,
        b.name,
        COALESCE(tp.college_name, b.college_name) as college_name,
        b.description,
        b.icon_image,
        b.cover_image,
        b.created_at,
        COUNT(bm.student_id) as member_count
      FROM batches b
      LEFT JOIN batch_members bm ON b.batch_id = bm.batch_id
      LEFT JOIN teacher_profiles tp ON b.teacher_id = tp.user_id
      WHERE b.teacher_id = ?
      GROUP BY b.batch_id
      ORDER BY b.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: batches
    });

  } catch (error) {
    console.error('Get teacher batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get batch details with members
 * Accessible by teacher or batch members
 */
const getBatchDetails = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { batchId } = req.params;

    // Get batch information with teacher details
    const [batches] = await pool.execute(`
      SELECT 
        b.batch_id,
        b.name,
        COALESCE(tp.college_name, b.college_name) as college_name,
        b.description,
        b.icon_image,
        b.cover_image,
        b.created_at,
        b.teacher_id,
        u.name as teacher_name,
        u.email as teacher_email,
        tp.contact_number as teacher_contact_number,
        tp.profile_picture_url as teacher_profile_picture_url
      FROM batches b
      JOIN users u ON b.teacher_id = u.user_id
      LEFT JOIN teacher_profiles tp ON u.user_id = tp.user_id
      WHERE b.batch_id = ?
    `, [batchId]);

    if (batches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const batch = batches[0];

    // Check if user has access to this batch
    const isTeacher = role === 'teacher' && batch.teacher_id == userId; // Use == for type comparison
    let isMember = false;

    if (role === 'student') {
      const [memberCheck] = await pool.execute(
        'SELECT 1 FROM batch_members WHERE batch_id = ? AND student_id = ?',
        [batchId, userId]
      );
      isMember = memberCheck.length > 0;
    }

    // Allow access if user is the teacher (owner) or a member
    if (!isTeacher && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this batch'
      });
    }

    // Get batch members
    const [members] = await pool.execute(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        bm.joined_at,
        CASE 
          WHEN u.role = 'teacher' THEN tp.profile_picture_url
          ELSE sp.profile_picture_url
        END as profile_picture_url
      FROM batch_members bm
      JOIN users u ON bm.student_id = u.user_id
      LEFT JOIN teacher_profiles tp ON u.user_id = tp.user_id AND u.role = 'teacher'
      LEFT JOIN student_profiles sp ON u.user_id = sp.user_id AND u.role = 'student'
      WHERE bm.batch_id = ?
      ORDER BY bm.joined_at ASC
    `, [batchId]);

    res.json({
      success: true,
      data: {
        ...batch,
        members
      }
    });

  } catch (error) {
    console.error('Get batch details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Join a batch with password
 * Student-only operation
 */
const joinBatch = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { batchId, password } = req.body;

    // Validate student role
    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can join batches'
      });
    }

    // Validate required fields
    if (!batchId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Batch ID and password are required'
      });
    }

    // Get batch information and verify password
    const [batches] = await pool.execute(
      'SELECT batch_id, name, password FROM batches WHERE batch_id = ?',
      [batchId]
    );

    if (batches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    const batch = batches[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, batch.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect batch password'
      });
    }

    // Check if student is already a member
    const [existingMember] = await pool.execute(
      'SELECT 1 FROM batch_members WHERE batch_id = ? AND student_id = ?',
      [batchId, userId]
    );

    if (existingMember.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You are already a member of this batch'
      });
    }

    // Add student to batch
    await pool.execute(
      'INSERT INTO batch_members (batch_id, student_id) VALUES (?, ?)',
      [batchId, userId]
    );

    // Get student information for notification
    const [studentData] = await pool.execute(`
      SELECT 
        u.name as student_name,
        u.email as student_email,
        sp.roll_number as student_roll_number,
        sp.profile_picture_url as student_avatar
      FROM users u
      LEFT JOIN student_profiles sp ON u.user_id = sp.user_id
      WHERE u.user_id = ?
    `, [userId]);

    const student = studentData[0];

    // Get batch teacher information
    const [teacherData] = await pool.execute(
      'SELECT teacher_id FROM batches WHERE batch_id = ?',
      [batchId]
    );

    if (teacherData.length > 0) {
      const teacherId = teacherData[0].teacher_id;

      // Create notification for teacher
      const { createNotification } = require('./notificationController');
      
      try {
        await createNotification({
          body: {
            teacherId: teacherId,
            studentId: userId,
            batchId: batchId,
            submissionId: null, // No submission for batch join
            type: 'batch_join',
            title: `New Student Joined ${batch.name}`,
            message: `${student.student_name} has joined your batch "${batch.name}"`
          }
        }, {
          json: () => {} // Mock response for internal call
        });
      } catch (notificationError) {
        console.error('Error creating batch join notification:', notificationError);
        // Don't fail the join if notification fails
      }

      // Send real-time notification to teacher
      const io = req.app.get('io');
      if (io) {
        io.to(`teacher_notifications_${teacherId}`).emit('new_notification', {
          id: Date.now(), // Temporary ID for real-time update
          type: 'batch_join',
          user: {
            name: student.student_name,
            email: student.student_email,
            roll_number: student.student_roll_number,
            avatar: student.student_avatar,
            fallback: student.student_name.charAt(0).toUpperCase()
          },
          action: 'joined',
          target: batch.name,
          content: `${student.student_name} has joined your batch`,
          timestamp: new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          timeAgo: 'Just now',
          isRead: false,
          submission_id: null,
          batch_id: batchId,
          batch_name: batch.name
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully joined ${batch.name}`,
      data: {
        batchId: batch.batch_id,
        batchName: batch.name
      }
    });

  } catch (error) {
    console.error('Join batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update batch information
 * Teacher-only operation for their own batches
 */
const updateBatch = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { batchId } = req.params;
    const { name, collegeName, description, iconImage, coverImage } = req.body;

    // Validate teacher role
    if (role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can update batches'
      });
    }

    // Check if batch exists and belongs to this teacher
    const [batches] = await pool.execute(
      'SELECT teacher_id FROM batches WHERE batch_id = ?',
      [batchId]
    );

    if (batches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    if (batches[0].teacher_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own batches'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (collegeName !== undefined) {
      updateFields.push('college_name = ?');
      updateValues.push(collegeName);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (iconImage !== undefined) {
      updateFields.push('icon_image = ?');
      updateValues.push(iconImage);
    }
    if (coverImage !== undefined) {
      updateFields.push('cover_image = ?');
      updateValues.push(coverImage);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(batchId);

    // Update batch
    await pool.execute(
      `UPDATE batches SET ${updateFields.join(', ')} WHERE batch_id = ?`,
      updateValues
    );

    res.json({
      success: true,
      message: 'Batch updated successfully'
    });

  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete a batch
 * Teacher-only operation for their own batches
 */
const deleteBatch = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { batchId } = req.params;

    // Validate teacher role
    if (role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can delete batches'
      });
    }

    // Check if batch exists and belongs to this teacher
    const [batches] = await pool.execute(
      'SELECT teacher_id FROM batches WHERE batch_id = ?',
      [batchId]
    );

    if (batches.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    if (batches[0].teacher_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own batches'
      });
    }

    // Delete batch (CASCADE will handle batch_members)
    await pool.execute('DELETE FROM batches WHERE batch_id = ?', [batchId]);

    res.json({
      success: true,
      message: 'Batch deleted successfully'
    });

  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get student's joined batches
 * Student-only operation
 */
const getStudentBatches = async (req, res) => {
  try {
    const { userId, role } = req.user;

    // Validate student role
    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can view their joined batches'
      });
    }

    // Use enhanced database connection for better error handling
    const { executeQuery } = require('../utils/enhanced-db-connection');
    
    // Get all batches joined by this student with member count
    const batches = await executeQuery(`
      SELECT 
        b.batch_id,
        b.name,
        COALESCE(tp.college_name, b.college_name) as college_name,
        b.description,
        b.icon_image,
        b.cover_image,
        b.created_at,
        u.name as teacher_name,
        bm.joined_at,
        COUNT(DISTINCT bm2.student_id) as member_count
      FROM batch_members bm
      JOIN batches b ON bm.batch_id = b.batch_id
      JOIN users u ON b.teacher_id = u.user_id
      LEFT JOIN teacher_profiles tp ON u.user_id = tp.user_id
      LEFT JOIN batch_members bm2 ON b.batch_id = bm2.batch_id
      WHERE bm.student_id = ?
      GROUP BY b.batch_id, b.name, COALESCE(tp.college_name, b.college_name), b.description, b.icon_image, b.cover_image, b.created_at, u.name, bm.joined_at
      ORDER BY bm.joined_at DESC
    `, [userId]);

    // Handle database timeout gracefully
    if (batches === null) {
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again in a moment.',
        retryAfter: 30
      });
    }

    res.json({
      success: true,
      data: batches
    });

  } catch (error) {
    console.error('Get student batches error:', error);
    
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
 * Get all available batches for browsing
 * Public endpoint for students and teachers to discover batches
 */
const getAllBatches = async (req, res) => {
  try {
    const { userId, role } = req.user;

    // Allow both students and teachers to browse batches
    if (role !== 'student' && role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only students and teachers can browse batches'
      });
    }

    // Check if database is available
    const { isDatabaseAvailable } = require('../utils/enhanced-db-connection');
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again later.',
        error: 'DATABASE_UNAVAILABLE'
      });
    }

    // Get all batches with basic info and teacher details
    const [batches] = await pool.execute(`
      SELECT 
        b.batch_id,
        b.name,
        COALESCE(tp.college_name, b.college_name) as college_name,
        b.description,
        b.icon_image,
        b.cover_image,
        b.created_at,
        b.teacher_id,
        u.name as teacher_name,
        COUNT(DISTINCT bm.student_id) as member_count
      FROM batches b
      JOIN users u ON b.teacher_id = u.user_id
      LEFT JOIN teacher_profiles tp ON u.user_id = tp.user_id
      LEFT JOIN batch_members bm ON b.batch_id = bm.batch_id
      GROUP BY b.batch_id, b.name, COALESCE(tp.college_name, b.college_name), b.description, b.icon_image, b.cover_image, b.created_at, b.teacher_id, u.name
      ORDER BY b.created_at DESC
    `);

    // Process batches based on user role
    const processedBatches = await Promise.all(
      batches.map(async (batch) => {
        if (role === 'student') {
          // For students, check if they're already a member
          const [memberCheck] = await pool.execute(
            'SELECT 1 FROM batch_members WHERE batch_id = ? AND student_id = ?',
            [batch.batch_id, userId]
          );
          
          return {
            ...batch,
            is_member: memberCheck.length > 0,
            can_join: memberCheck.length === 0 // Student can join if not already a member
          };
        } else if (role === 'teacher') {
          // For teachers, mark if it's their own batch
          const isOwnBatch = batch.teacher_id == userId; // Use == for type comparison
          return {
            ...batch,
            is_member: false, // Teachers don't "join" batches
            can_join: false,  // Teachers don't join batches
            is_own_batch: isOwnBatch // Mark if it's the teacher's own batch
          };
        }
        
        // Default return for any other role
        return {
          ...batch,
          is_member: false,
          can_join: false
        };
      })
    );

    res.json({
      success: true,
      data: processedBatches
    });

  } catch (error) {
    console.error('Get all batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createBatch,
  getTeacherBatches,
  getBatchDetails,
  joinBatch,
  updateBatch,
  deleteBatch,
  getStudentBatches,
  getAllBatches
};
