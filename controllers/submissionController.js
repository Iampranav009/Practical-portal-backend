const { pool, executeQuery, isDatabaseAvailable } = require('../utils/database');

/**
 * Submission Controller
 * Handles all submission-related operations including create, read, and status updates
 * Manages real-time notifications via Socket.IO
 */

/**
 * Create a new submission
 * Students can post text content with optional file attachment
 */
const createSubmission = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { batchId, practicalName, content, fileUrl, codeSandboxLink, codeLanguage } = req.body;

    // Validate required fields
    if (!batchId || !practicalName || !content) {
      return res.status(400).json({
        success: false,
        message: 'Batch ID, practical name, and content are required'
      });
    }

    // Only students can create submissions
    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can create submissions'
      });
    }

    // Check if student is a member of the batch
    const [memberCheck] = await pool.execute(
      'SELECT 1 FROM batch_members WHERE batch_id = ? AND student_id = ?',
      [batchId, userId]
    );

    if (memberCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this batch'
      });
    }

    // Create submission
    const [result] = await pool.execute(
      'INSERT INTO submissions (batch_id, student_id, practical_name, content, file_url, code_sandbox_link, code_language) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [batchId, userId, practicalName, content, fileUrl || null, codeSandboxLink || null, codeLanguage || null]
    );

    // Get submission details with student info for real-time notification
    const [submissionData] = await pool.execute(`
      SELECT 
        s.*,
        u.name as student_name,
        u.email as student_email,
        sp.roll_number as student_roll_number,
        sp.year as student_year,
        sp.subject as student_subject,
        sp.profile_picture_url
      FROM submissions s
      JOIN users u ON s.student_id = u.user_id
      LEFT JOIN student_profiles sp ON u.user_id = sp.user_id
      WHERE s.submission_id = ?
    `, [result.insertId]);

    const submission = submissionData[0];

    // Get batch teacher ID for notification
    const [batchData] = await pool.execute(
      'SELECT teacher_id, name as batch_name FROM batches WHERE batch_id = ?',
      [batchId]
    );
    
    if (batchData.length > 0) {
      const { teacher_id, batch_name } = batchData[0];
      
      // Create notification for teacher
      const { createNotification } = require('./notificationController');
      
      try {
        await createNotification({
          body: {
            teacherId: teacher_id,
            studentId: userId,
            batchId: batchId,
            submissionId: result.insertId,
            type: 'submission',
            title: `New Submission from ${submission.student_name}`,
            message: `"${practicalName}" - ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`
          }
        }, {
          json: () => {} // Mock response for internal call
        });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the submission if notification fails
      }
    }

    // Send real-time notification to batch members (especially teacher)
    const io = req.app.get('io');
    io.to(`batch_${batchId}`).emit('submissionCreated', {
      submission: submission,
      message: `New submission from ${submission.student_name}`
    });

    // Send real-time notification to teacher
    if (batchData.length > 0) {
      io.to(`teacher_notifications_${batchData[0].teacher_id}`).emit('new_notification', {
        id: Date.now(), // Temporary ID for real-time update
        type: 'submission',
        user: {
          name: submission.student_name,
          email: submission.student_email,
          roll_number: submission.student_roll_number,
          avatar: submission.profile_picture_url,
          fallback: submission.student_name.charAt(0).toUpperCase()
        },
        action: 'submitted a new post in',
        target: batchData[0].batch_name,
        content: `"${practicalName}" - ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        timestamp: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        timeAgo: 'Just now',
        isRead: false,
        submission_id: result.insertId,
        batch_id: batchId,
        batch_name: batchData[0].batch_name
      });
    }

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data: submission
    });

  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all submissions for a specific batch
 * Teachers can see all student submissions in their batch
 * Students can only see their own submissions (private feed)
 */
const getBatchSubmissions = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { batchId } = req.params;

    // Check if user has access to this batch
    let hasAccess = false;
    
    if (role === 'teacher') {
      // Check if teacher owns the batch
      const [teacherCheck] = await pool.execute(
        'SELECT 1 FROM batches WHERE batch_id = ? AND teacher_id = ?',
        [batchId, userId]
      );
      hasAccess = teacherCheck.length > 0;
    } else {
      // Check if student is a member
      const [memberCheck] = await pool.execute(
        'SELECT 1 FROM batch_members WHERE batch_id = ? AND student_id = ?',
        [batchId, userId]
      );
      hasAccess = memberCheck.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this batch'
      });
    }

    // Build query based on role
    let query = `
      SELECT 
        s.*,
        u.name as student_name,
        u.email as student_email,
        sp.roll_number as student_roll_number,
        sp.year as student_year,
        sp.subject as student_subject,
        CASE 
          WHEN u.role = 'student' THEN sp.profile_picture_url
          ELSE tp.profile_picture_url
        END as profile_picture_url
      FROM submissions s
      JOIN users u ON s.student_id = u.user_id
      LEFT JOIN student_profiles sp ON u.user_id = sp.user_id AND u.role = 'student'
      LEFT JOIN teacher_profiles tp ON u.user_id = tp.user_id AND u.role = 'teacher'
      WHERE s.batch_id = ?
    `;
    
    const queryParams = [batchId];

    // Students can only see their own submissions (private feed)
    if (role === 'student') {
      query += ' AND s.student_id = ?';
      queryParams.push(userId);
      console.log('🔍 [Backend] Student query - User ID:', userId, 'Batch ID:', batchId);
    } else {
      console.log('🔍 [Backend] Teacher query - User ID:', userId, 'Batch ID:', batchId);
    }

    query += ' ORDER BY s.created_at DESC';
    
    console.log('🔍 [Backend] Final query:', query);
    console.log('🔍 [Backend] Query params:', queryParams);

    const [submissions] = await pool.execute(query, queryParams);
    
    console.log('📊 [Backend] Query result - Number of submissions:', submissions.length);
    console.log('📝 [Backend] Submissions:', submissions.map(s => ({ id: s.submission_id, student_id: s.student_id, student_name: s.student_name })));

    res.json({
      success: true,
      data: submissions
    });

  } catch (error) {
    console.error('Get batch submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update submission status (accept/reject)
 * Only teachers can update submission status
 */
const updateSubmissionStatus = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { submissionId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "accepted" or "rejected"'
      });
    }

    // Only teachers can update submission status
    if (role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can update submission status'
      });
    }

    // Get submission details and verify teacher owns the batch
    const [submissionCheck] = await pool.execute(`
      SELECT s.*, b.teacher_id, u.name as student_name
      FROM submissions s
      JOIN batches b ON s.batch_id = b.batch_id
      JOIN users u ON s.student_id = u.user_id
      WHERE s.submission_id = ?
    `, [submissionId]);

    if (submissionCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const submission = submissionCheck[0];

    if (submission.teacher_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update submissions in your own batches'
      });
    }

    // Update submission status
    await pool.execute(
      'UPDATE submissions SET status = ? WHERE submission_id = ?',
      [status, submissionId]
    );

    // Get updated submission data
    const [updatedSubmission] = await pool.execute(`
      SELECT 
        s.*,
        u.name as student_name,
        u.email as student_email
      FROM submissions s
      JOIN users u ON s.student_id = u.user_id
      WHERE s.submission_id = ?
    `, [submissionId]);

    const finalSubmission = updatedSubmission[0];

    // Send real-time notification to student and batch members
    const io = req.app.get('io');
    io.to(`batch_${submission.batch_id}`).emit('submissionUpdated', {
      submission: finalSubmission,
      message: `Submission ${status} by teacher`
    });

    res.json({
      success: true,
      message: `Submission ${status} successfully`,
      data: finalSubmission
    });

  } catch (error) {
    console.error('Update submission status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get accepted submissions across all batches for explore feed
 * Returns public submissions that are accepted
 * Note: This endpoint is for public exploration, not batch-specific feeds
 */
const getExploreSubmissions = async (req, res) => {
  try {
    const { batchName } = req.query;

    // Build query for accepted submissions across batches
    let query = `
      SELECT 
        s.*,
        u.name as student_name,
        u.email as student_email,
        b.name as batch_name,
        COALESCE(tp.college_name, b.college_name) as college_name,
        CASE 
          WHEN u.role = 'student' THEN sp.profile_picture_url
          ELSE tp.profile_picture_url
        END as profile_picture_url
      FROM submissions s
      JOIN users u ON s.student_id = u.user_id
      JOIN batches b ON s.batch_id = b.batch_id
      LEFT JOIN teacher_profiles tp ON b.teacher_id = tp.user_id
      LEFT JOIN student_profiles sp ON u.user_id = sp.user_id AND u.role = 'student'
      WHERE s.status = 'accepted'
    `;

    const queryParams = [];

    // Filter by batch name if provided
    if (batchName) {
      query += ' AND b.name LIKE ?';
      queryParams.push(`%${batchName}%`);
    }

    query += ' ORDER BY s.created_at DESC LIMIT 50';

    const [submissions] = await pool.execute(query, queryParams);

    res.json({
      success: true,
      data: submissions
    });

  } catch (error) {
    console.error('Get explore submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get student's submission history
 * Returns all submissions made by the authenticated student
 */
const getStudentSubmissions = async (req, res) => {
  try {
    const { userId, role } = req.user;

    // Only students can access this endpoint
    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can access submission history'
      });
    }

    const [submissions] = await pool.execute(`
      SELECT 
        s.*,
        b.name as batch_name,
        COALESCE(tp.college_name, b.college_name) as college_name
      FROM submissions s
      JOIN batches b ON s.batch_id = b.batch_id
      LEFT JOIN teacher_profiles tp ON b.teacher_id = tp.user_id
      WHERE s.student_id = ?
      ORDER BY s.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: submissions
    });

  } catch (error) {
    console.error('Get student submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

 /**
 * Edit a submission (students only, before teacher review)
 * Students can edit their own submissions if status is still 'pending'
 */
const editSubmission = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { submissionId } = req.params;
    const { practicalName, content, fileUrl, codeSandboxLink, codeLanguage } = req.body;

    // Validate required fields
    if (!practicalName || !content) {
      return res.status(400).json({
        success: false,
        message: 'Practical name and content are required'
      });
    }

    // Only students can edit submissions
    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can edit submissions'
      });
    }

    // Check if submission exists and belongs to the student
    const [submissionCheck] = await pool.execute(
      'SELECT * FROM submissions WHERE submission_id = ? AND student_id = ?',
      [submissionId, userId]
    );

    if (submissionCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found or access denied'
      });
    }

    const submission = submissionCheck[0];

    // Only allow editing if submission is still pending
    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit submissions that have been reviewed'
      });
    }

    // Update submission
    await pool.execute(
      'UPDATE submissions SET practical_name = ?, content = ?, file_url = ?, code_sandbox_link = ?, code_language = ? WHERE submission_id = ?',
      [practicalName, content, fileUrl || null, codeSandboxLink || null, codeLanguage || null, submissionId]
    );

    // Get updated submission details
    const [updatedSubmission] = await pool.execute(`
      SELECT 
        s.*,
        u.name as student_name,
        u.email as student_email
      FROM submissions s
      JOIN users u ON s.student_id = u.user_id
      WHERE s.submission_id = ?
    `, [submissionId]);

    const finalSubmission = updatedSubmission[0];

    // Send real-time notification to batch members
    const io = req.app.get('io');
    io.to(`batch_${submission.batch_id}`).emit('submissionUpdated', {
      submission: finalSubmission,
      message: `Submission updated by ${finalSubmission.student_name}`
    });

    res.json({
      success: true,
      message: 'Submission updated successfully',
      data: finalSubmission
    });

  } catch (error) {
    console.error('Edit submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete a submission (students only, before teacher review)
 * Students can delete their own submissions if status is still 'pending'
 */
const deleteSubmission = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { submissionId } = req.params;

    // Only students can delete submissions
    if (role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only students can delete submissions'
      });
    }

    // Check if submission exists and belongs to the student
    const [submissionCheck] = await pool.execute(
      'SELECT * FROM submissions WHERE submission_id = ? AND student_id = ?',
      [submissionId, userId]
    );

    if (submissionCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found or access denied'
      });
    }

    const submission = submissionCheck[0];

    // Only allow deletion if submission is still pending
    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete submissions that have been reviewed'
      });
    }

    // Delete submission
    await pool.execute(
      'DELETE FROM submissions WHERE submission_id = ?',
      [submissionId]
    );

    // Get student name for notification
    const [studentData] = await pool.execute(
      'SELECT name FROM users WHERE user_id = ?',
      [userId]
    );

    // Send real-time notification to batch members
    const io = req.app.get('io');
    io.to(`batch_${submission.batch_id}`).emit('submissionDeleted', {
      submissionId,
      batchId: submission.batch_id,
      message: `Submission deleted by ${studentData[0].name}`
    });

    res.json({
      success: true,
      message: 'Submission deleted successfully'
    });

  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get batch statistics
 * Teachers: Returns global batch statistics (all students)
 * Students: Returns personalized statistics (only their own submissions)
 */
const getBatchStats = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { batchId } = req.params;

    // Check if user has access to this batch
    let hasAccess = false;
    
    if (role === 'teacher') {
      // Check if teacher owns the batch
      const [teacherCheck] = await pool.execute(
        'SELECT 1 FROM batches WHERE batch_id = ? AND teacher_id = ?',
        [batchId, userId]
      );
      hasAccess = teacherCheck.length > 0;
    } else {
      // Check if student is a member
      const [memberCheck] = await pool.execute(
        'SELECT 1 FROM batch_members WHERE batch_id = ? AND student_id = ?',
        [batchId, userId]
      );
      hasAccess = memberCheck.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this batch'
      });
    }

    if (role === 'teacher') {
      // Teachers see global batch statistics
      console.log('🔍 [Backend] Teacher stats - User ID:', userId, 'Batch ID:', batchId);
    const [studentCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM batch_members WHERE batch_id = ?',
      [batchId]
    );

    const [totalSubmissions] = await pool.execute(
      'SELECT COUNT(*) as count FROM submissions WHERE batch_id = ?',
      [batchId]
    );

    const [pendingSubmissions] = await pool.execute(
      'SELECT COUNT(*) as count FROM submissions WHERE batch_id = ? AND status = "pending"',
      [batchId]
    );

      const [acceptedSubmissions] = await pool.execute(
        'SELECT COUNT(*) as count FROM submissions WHERE batch_id = ? AND status = "accepted"',
        [batchId]
      );

      const [rejectedSubmissions] = await pool.execute(
        'SELECT COUNT(*) as count FROM submissions WHERE batch_id = ? AND status = "rejected"',
        [batchId]
      );

      const responseData = {
        enrolledStudents: studentCount[0].count,
        totalSubmissions: totalSubmissions[0].count,
        pendingSubmissions: pendingSubmissions[0].count,
        acceptedSubmissions: acceptedSubmissions[0].count,
        rejectedSubmissions: rejectedSubmissions[0].count
      };
      console.log('📊 [Backend] Teacher stats response:', responseData);
      
      res.json({
        success: true,
        data: responseData
      });
    } else {
      // Students see only their own submission statistics
      console.log('🔍 [Backend] Student stats - User ID:', userId, 'Batch ID:', batchId);
      const [totalSubmissions] = await pool.execute(
        'SELECT COUNT(*) as count FROM submissions WHERE batch_id = ? AND student_id = ?',
        [batchId, userId]
      );

      const [pendingSubmissions] = await pool.execute(
        'SELECT COUNT(*) as count FROM submissions WHERE batch_id = ? AND student_id = ? AND status = "pending"',
        [batchId, userId]
      );

      const [acceptedSubmissions] = await pool.execute(
        'SELECT COUNT(*) as count FROM submissions WHERE batch_id = ? AND student_id = ? AND status = "accepted"',
        [batchId, userId]
      );

      const [rejectedSubmissions] = await pool.execute(
        'SELECT COUNT(*) as count FROM submissions WHERE batch_id = ? AND student_id = ? AND status = "rejected"',
        [batchId, userId]
      );

      const responseData = {
        enrolledStudents: 1, // Students only see themselves
        totalSubmissions: totalSubmissions[0].count,
        pendingSubmissions: pendingSubmissions[0].count,
        acceptedSubmissions: acceptedSubmissions[0].count,
        rejectedSubmissions: rejectedSubmissions[0].count
      };
      console.log('📊 [Backend] Student stats response:', responseData);
      
      res.json({
        success: true,
        data: responseData
      });
    }

  } catch (error) {
    console.error('Get batch stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get individual submission by ID
 * Students can only access their own submissions (private access)
 * Teachers can access any submission in their batches
 */
const getSubmission = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { submissionId } = req.params;

    let query, params;

    if (role === 'student') {
      // Students can only access their own submissions
      query = `
        SELECT 
          s.submission_id,
          s.batch_id,
          s.student_id,
          s.practical_name,
          s.content,
          s.file_url,
          s.code_sandbox_link,
          s.code_language,
          s.status,
          s.created_at,
          s.updated_at,
          u.name as student_name,
          u.email as student_email
        FROM submissions s
        JOIN users u ON s.student_id = u.user_id
        WHERE s.submission_id = ? AND s.student_id = ?
      `;
      params = [submissionId, userId];
    } else {
      // Teachers can only access submissions from their own batches
      query = `
        SELECT 
          s.submission_id,
          s.batch_id,
          s.student_id,
          s.practical_name,
          s.content,
          s.file_url,
          s.code_sandbox_link,
          s.code_language,
          s.status,
          s.created_at,
          s.updated_at,
          u.name as student_name,
          u.email as student_email
        FROM submissions s
        JOIN users u ON s.student_id = u.user_id
        JOIN batches b ON s.batch_id = b.batch_id
        WHERE s.submission_id = ? AND b.teacher_id = ?
      `;
      params = [submissionId, userId];
    }

    const [submissions] = await pool.execute(query, params);

    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found or access denied'
      });
    }

    const submission = submissions[0];

    res.json({
      success: true,
      data: {
        id: submission.submission_id,
        batchId: submission.batch_id,
        studentId: submission.student_id,
        practicalName: submission.practical_name,
        content: submission.content,
        fileUrl: submission.file_url,
        codeSandboxLink: submission.code_sandbox_link,
        codeLanguage: submission.code_language,
        status: submission.status,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
        studentName: submission.student_name,
        studentEmail: submission.student_email
      }
    });

  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createSubmission,
  getBatchSubmissions,
  updateSubmissionStatus,
  getExploreSubmissions,
  getStudentSubmissions,
  editSubmission,
  deleteSubmission,
  getSubmission,
  getBatchStats
};
