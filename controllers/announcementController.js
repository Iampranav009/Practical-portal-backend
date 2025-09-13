const { pool } = require('../utils/database')
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHelper')

/**
 * Announcement Controller
 * Handles all announcement-related operations for batches
 * Teachers can create announcements, students can view and mark as read
 */

/**
 * Create a new announcement for a batch (Teacher only)
 * POST /api/announcements
 */
const createAnnouncement = async (req, res) => {
  try {
    const { batch_id, message } = req.body
    const teacher_id = req.user?.userId || req.user?.user_id

    // Validate required fields
    if (!batch_id || !message || !teacher_id) {
      return sendErrorResponse(res, 400, 'Batch ID, message, and user authentication are required')
    }

    // Ensure batch_id is a number
    const batchId = parseInt(batch_id)
    if (isNaN(batchId)) {
      return sendErrorResponse(res, 400, 'Batch ID must be a valid number')
    }

    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return sendErrorResponse(res, 403, 'Only teachers can create announcements')
    }

    // Verify teacher has access to this batch
    const [batchCheck] = await pool.execute(
      'SELECT batch_id FROM batches WHERE batch_id = ? AND teacher_id = ?',
      [batchId, teacher_id]
    )

    if (batchCheck.length === 0) {
      return sendErrorResponse(res, 403, 'You do not have access to this batch')
    }

    // Create the announcement
    const [result] = await pool.execute(
      'INSERT INTO announcements (batch_id, teacher_id, message) VALUES (?, ?, ?)',
      [batchId, teacher_id, message]
    )

    const announcementId = result.insertId

    // Get the created announcement with teacher details
    const [announcement] = await pool.execute(`
      SELECT 
        a.announcement_id,
        a.batch_id,
        a.message,
        a.created_at,
        u.name as teacher_name,
        u.email as teacher_email
      FROM announcements a
      JOIN users u ON a.teacher_id = u.user_id
      WHERE a.announcement_id = ?
    `, [announcementId])

    if (announcement.length === 0) {
      return sendErrorResponse(res, 500, 'Failed to retrieve created announcement')
    }

    // Emit real-time announcement to all users in the batch
    const io = global.io
    if (io) {
      io.to(`batch_${batchId}`).emit('announcementCreated', {
        announcement: announcement[0]
      })
      console.log(`📢 Announcement broadcasted to batch ${batchId}`)
    }

    return sendSuccessResponse(res, 201, 'Announcement created successfully', announcement[0])

  } catch (error) {
    console.error('Error creating announcement:', error)
    return sendErrorResponse(res, 500, 'Internal server error')
  }
}

/**
 * Get all announcements for a batch
 * GET /api/announcements/batch/:batch_id
 */
const getBatchAnnouncements = async (req, res) => {
  try {
    const { batch_id } = req.params
    const user_id = req.user?.userId || req.user?.user_id
    const user_role = req.user?.role

    // Validate required parameters
    if (!batch_id || !user_id || !user_role) {
      return sendErrorResponse(res, 400, 'Batch ID and user authentication are required')
    }

    // Ensure batch_id is a number
    const batchId = parseInt(batch_id)
    if (isNaN(batchId)) {
      return sendErrorResponse(res, 400, 'Batch ID must be a valid number')
    }

    // Verify user has access to this batch
    const [batchAccess] = await pool.execute(`
      SELECT b.batch_id, b.teacher_id
      FROM batches b
      LEFT JOIN batch_members bm ON b.batch_id = bm.batch_id AND bm.student_id = ?
      WHERE b.batch_id = ? AND (b.teacher_id = ? OR bm.student_id = ?)
    `, [user_id, batchId, user_id, user_id])

    if (batchAccess.length === 0) {
      return sendErrorResponse(res, 403, 'You do not have access to this batch')
    }

    // Get announcements with teacher details and read status for students
    let query = `
      SELECT 
        a.announcement_id,
        a.batch_id,
        a.message,
        a.created_at,
        u.name as teacher_name,
        u.email as teacher_email
    `

    if (user_role === 'student') {
      query += `,
        CASE WHEN ar.read_id IS NOT NULL THEN 1 ELSE 0 END as is_read,
        ar.read_at
      FROM announcements a
      JOIN users u ON a.teacher_id = u.user_id
      LEFT JOIN announcement_reads ar ON a.announcement_id = ar.announcement_id AND ar.student_id = ?
      WHERE a.batch_id = ?
      ORDER BY a.created_at ASC
    `
    } else {
      query += `
      FROM announcements a
      JOIN users u ON a.teacher_id = u.user_id
      WHERE a.batch_id = ?
      ORDER BY a.created_at ASC
      `
    }

    const [announcements] = user_role === 'student' 
      ? await pool.execute(query, [user_id, batchId])
      : await pool.execute(query, [batchId])

    return sendSuccessResponse(res, 200, 'Announcements retrieved successfully', announcements)

  } catch (error) {
    console.error('Error fetching announcements:', error)
    return sendErrorResponse(res, 500, 'Internal server error')
  }
}

/**
 * Mark an announcement as read (Student only)
 * POST /api/announcements/:announcement_id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { announcement_id } = req.params
    const student_id = req.user?.userId || req.user?.user_id

    // Validate required parameters
    if (!announcement_id || !student_id) {
      return sendErrorResponse(res, 400, 'Announcement ID and user authentication are required')
    }

    // Ensure announcement_id is a number
    const announcementId = parseInt(announcement_id)
    if (isNaN(announcementId)) {
      return sendErrorResponse(res, 400, 'Announcement ID must be a valid number')
    }

    // Check if user is a student
    if (req.user.role !== 'student') {
      return sendErrorResponse(res, 403, 'Only students can mark announcements as read')
    }

    // Verify announcement exists and student has access to the batch
    const [announcementCheck] = await pool.execute(`
      SELECT a.announcement_id, a.batch_id
      FROM announcements a
      JOIN batch_members bm ON a.batch_id = bm.batch_id
      WHERE a.announcement_id = ? AND bm.student_id = ?
    `, [announcementId, student_id])

    if (announcementCheck.length === 0) {
      return sendErrorResponse(res, 404, 'Announcement not found or access denied')
    }

    // Check if already marked as read
    const [existingRead] = await pool.execute(
      'SELECT read_id FROM announcement_reads WHERE announcement_id = ? AND student_id = ?',
      [announcementId, student_id]
    )

    if (existingRead.length > 0) {
      return sendSuccessResponse(res, 200, 'Announcement already marked as read', { already_read: true })
    }

    // Mark as read
    await pool.execute(
      'INSERT INTO announcement_reads (announcement_id, student_id) VALUES (?, ?)',
      [announcementId, student_id]
    )

    return sendSuccessResponse(res, 200, 'Announcement marked as read', { marked_as_read: true })

  } catch (error) {
    console.error('Error marking announcement as read:', error)
    return sendErrorResponse(res, 500, 'Internal server error')
  }
}

/**
 * Get unread announcement count for a student
 * GET /api/announcements/unread-count/:batch_id
 */
const getUnreadCount = async (req, res) => {
  try {
    const { batch_id } = req.params
    const student_id = req.user?.userId || req.user?.user_id

    // Validate required parameters
    if (!batch_id || !student_id) {
      return sendErrorResponse(res, 400, 'Batch ID and user authentication are required')
    }

    // Ensure batch_id is a number
    const batchId = parseInt(batch_id)
    if (isNaN(batchId)) {
      return sendErrorResponse(res, 400, 'Batch ID must be a valid number')
    }

    // Check if user is a student
    if (req.user.role !== 'student') {
      return sendErrorResponse(res, 403, 'Only students can check unread count')
    }

    // Verify student has access to this batch
    const [batchAccess] = await pool.execute(
      'SELECT batch_id FROM batch_members WHERE batch_id = ? AND student_id = ?',
      [batchId, student_id]
    )

    if (batchAccess.length === 0) {
      return sendErrorResponse(res, 403, 'You do not have access to this batch')
    }

    // Get unread count
    const [unreadCount] = await pool.execute(`
      SELECT COUNT(*) as unread_count
      FROM announcements a
      LEFT JOIN announcement_reads ar ON a.announcement_id = ar.announcement_id AND ar.student_id = ?
      WHERE a.batch_id = ? AND ar.read_id IS NULL
    `, [student_id, batchId])

    return sendSuccessResponse(res, 200, 'Unread count retrieved successfully', { 
      unread_count: unreadCount[0].unread_count 
    })

  } catch (error) {
    console.error('Error fetching unread count:', error)
    return sendErrorResponse(res, 500, 'Internal server error')
  }
}

/**
 * Delete an announcement (Teacher only)
 * DELETE /api/announcements/:announcement_id
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const { announcement_id } = req.params
    const teacher_id = req.user?.userId || req.user?.user_id

    // Validate required parameters
    if (!announcement_id || !teacher_id) {
      return sendErrorResponse(res, 400, 'Announcement ID and user authentication are required')
    }

    // Ensure announcement_id is a number
    const announcementId = parseInt(announcement_id)
    if (isNaN(announcementId)) {
      return sendErrorResponse(res, 400, 'Announcement ID must be a valid number')
    }

    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return sendErrorResponse(res, 403, 'Only teachers can delete announcements')
    }

    // Verify teacher owns this announcement
    const [announcementCheck] = await pool.execute(
      'SELECT announcement_id FROM announcements WHERE announcement_id = ? AND teacher_id = ?',
      [announcementId, teacher_id]
    )

    if (announcementCheck.length === 0) {
      return sendErrorResponse(res, 404, 'Announcement not found or access denied')
    }

    // Delete the announcement (cascade will handle announcement_reads)
    await pool.execute('DELETE FROM announcements WHERE announcement_id = ?', [announcementId])

    return sendSuccessResponse(res, 200, 'Announcement deleted successfully', { deleted: true })

  } catch (error) {
    console.error('Error deleting announcement:', error)
    return sendErrorResponse(res, 500, 'Internal server error')
  }
}

module.exports = {
  createAnnouncement,
  getBatchAnnouncements,
  markAsRead,
  getUnreadCount,
  deleteAnnouncement
}
