const { pool } = require('../db/connection');
const { getTeacherNotifications: getTeacherNotificationsData } = require('../utils/db-utils');
const { sendEmailNotification } = require('../utils/emailService');

/**
 * Notification Controller
 * Handles all notification-related operations for teachers
 * Includes real-time notifications and email notifications
 */

/**
 * Get all notifications for a teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTeacherNotifications = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { page = 1, limit = 50, type, unread_only } = req.query;

    // Validate teacher ID
    if (!teacherId || isNaN(parseInt(teacherId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID'
      });
    }

    // Build query conditions
    let whereConditions = ['n.teacher_id = ?'];
    let queryParams = [teacherId];

    // Filter by type if specified
    if (type && ['submission', 'announcement', 'batch_join'].includes(type)) {
      whereConditions.push('n.type = ?');
      queryParams.push(type);
    }

    // Filter unread only if specified
    if (unread_only === 'true') {
      whereConditions.push('n.is_read = FALSE');
    }

    const whereClause = whereConditions.join(' AND ');

    // Use the safe query function with retry logic
    const result = await getTeacherNotificationsData(teacherId, page, limit);
    const { notifications, total, totalPages } = result;

    // Format notifications for frontend
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      user: {
        name: notification.student_name,
        email: notification.student_email,
        roll_number: notification.roll_number,
        avatar: notification.student_avatar,
        fallback: notification.student_name.charAt(0).toUpperCase()
      },
      action: getActionText(notification.type),
      target: notification.batch_name,
      content: notification.content,
      timestamp: formatTimestamp(notification.timestamp),
      timeAgo: notification.timeAgo,
      isRead: notification.is_read,
      submission_id: notification.submission_id,
      batch_id: notification.batch_id,
      batch_name: notification.batch_name
    }));

    res.json({
      success: true,
      data: formattedNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching teacher notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

/**
 * Mark a notification as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { teacherId } = req.body;

    // Validate inputs
    if (!notificationId || isNaN(parseInt(notificationId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required'
      });
    }

    // Update notification as read
    const updateQuery = `
      UPDATE notifications 
      SET is_read = TRUE, updated_at = NOW()
      WHERE notification_id = ? AND teacher_id = ?
    `;

    const [result] = await pool.execute(updateQuery, [notificationId, teacherId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

/**
 * Mark all notifications as read for a teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Validate teacher ID
    if (!teacherId || isNaN(parseInt(teacherId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID'
      });
    }

    // Update all notifications as read
    const updateQuery = `
      UPDATE notifications 
      SET is_read = TRUE, updated_at = NOW()
      WHERE teacher_id = ? AND is_read = FALSE
    `;

    const [result] = await pool.execute(updateQuery, [teacherId]);

    res.json({
      success: true,
      message: `${result.affectedRows} notifications marked as read`
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

/**
 * Delete all notifications for a teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteAllNotifications = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Validate teacher ID
    if (!teacherId || isNaN(parseInt(teacherId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID'
      });
    }

    // Delete all notifications for the teacher
    const deleteQuery = 'DELETE FROM notifications WHERE teacher_id = ?';
    const [result] = await pool.execute(deleteQuery, [teacherId]);

    res.json({
      success: true,
      message: 'All notifications deleted successfully',
      data: {
        deletedCount: result.affectedRows
      }
    });

  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all notifications'
    });
  }
};

/**
 * Create a new notification for a teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createNotification = async (req, res) => {
  try {
    const { teacherId, studentId, batchId, submissionId, type, title, message } = req.body;

    // Validate required fields
    if (!teacherId || !studentId || !batchId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate type
    if (!['submission', 'announcement', 'batch_join'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type'
      });
    }

    // Insert notification
    const insertQuery = `
      INSERT INTO notifications (teacher_id, student_id, batch_id, submission_id, type, title, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(insertQuery, [
      teacherId, studentId, batchId, submissionId, type, title, message
    ]);

    const notificationId = result.insertId;

    // Get notification details for response
    const getNotificationQuery = `
      SELECT 
        n.notification_id as id,
        n.type,
        n.title,
        n.message as content,
        n.is_read,
        n.created_at as timestamp,
        n.submission_id,
        n.batch_id,
        b.name as batch_name,
        u.name as student_name,
        u.email as student_email,
        sp.roll_number,
        sp.profile_picture_url as student_avatar
      FROM notifications n
      JOIN users u ON n.student_id = u.user_id
      JOIN batches b ON n.batch_id = b.batch_id
      LEFT JOIN student_profiles sp ON u.user_id = sp.user_id
      WHERE n.notification_id = ?
    `;

    const [notificationResult] = await pool.execute(getNotificationQuery, [notificationId]);
    const notification = notificationResult[0];

    // Check if teacher has email notifications enabled
    const settingsQuery = `
      SELECT email_notifications, submission_notifications, announcement_notifications, batch_join_notifications
      FROM notification_settings
      WHERE teacher_id = ?
    `;

    const [settingsResult] = await pool.execute(settingsQuery, [teacherId]);
    const settings = settingsResult[0];

    // Send email notification if enabled
    if (settings && settings.email_notifications) {
      const shouldSendEmail = 
        (type === 'submission' && settings.submission_notifications) ||
        (type === 'announcement' && settings.announcement_notifications) ||
        (type === 'batch_join' && settings.batch_join_notifications);

      if (shouldSendEmail) {
        try {
          await sendEmailNotification({
            teacherId,
            studentName: notification.student_name,
            studentEmail: notification.student_email,
            rollNumber: notification.roll_number,
            batchName: notification.batch_name,
            type,
            title,
            message,
            submissionId: notification.submission_id,
            batchId: notification.batch_id
          });
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't fail the request if email fails
        }
      }
    }

    // Format notification for response
    const formattedNotification = {
      id: notification.id,
      type: notification.type,
      user: {
        name: notification.student_name,
        email: notification.student_email,
        roll_number: notification.roll_number,
        avatar: notification.student_avatar,
        fallback: notification.student_name.charAt(0).toUpperCase()
      },
      action: getActionText(notification.type),
      target: notification.batch_name,
      content: notification.content,
      timestamp: formatTimestamp(notification.timestamp),
      timeAgo: 'Just now',
      isRead: notification.is_read,
      submission_id: notification.submission_id,
      batch_id: notification.batch_id,
      batch_name: notification.batch_name
    };

    res.status(201).json({
      success: true,
      data: formattedNotification,
      message: 'Notification created successfully'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
};

/**
 * Get notification settings for a teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNotificationSettings = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Validate teacher ID
    if (!teacherId || isNaN(parseInt(teacherId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID'
      });
    }

    // Get or create notification settings
    let settingsQuery = `
      SELECT * FROM notification_settings WHERE teacher_id = ?
    `;

    const [settingsResult] = await pool.execute(settingsQuery, [teacherId]);

    let settings = settingsResult[0];

    // Create default settings if none exist
    if (!settings) {
      const insertQuery = `
        INSERT INTO notification_settings (teacher_id, email_notifications, submission_notifications, announcement_notifications, batch_join_notifications)
        VALUES (?, TRUE, TRUE, TRUE, TRUE)
      `;

      await pool.execute(insertQuery, [teacherId]);

      settings = {
        teacher_id: teacherId,
        email_notifications: true,
        submission_notifications: true,
        announcement_notifications: true,
        batch_join_notifications: true
      };
    }

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings'
    });
  }
};

/**
 * Update notification settings for a teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateNotificationSettings = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { email_notifications, submission_notifications, announcement_notifications, batch_join_notifications } = req.body;

    // Validate teacher ID
    if (!teacherId || isNaN(parseInt(teacherId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher ID'
      });
    }

    // Update settings
    const updateQuery = `
      UPDATE notification_settings 
      SET email_notifications = ?, submission_notifications = ?, announcement_notifications = ?, batch_join_notifications = ?, updated_at = NOW()
      WHERE teacher_id = ?
    `;

    await pool.execute(updateQuery, [
      email_notifications,
      submission_notifications,
      announcement_notifications,
      batch_join_notifications,
      teacherId
    ]);

    res.json({
      success: true,
      message: 'Notification settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings'
    });
  }
};

/**
 * Helper function to get action text based on notification type
 * @param {string} type - Notification type
 * @returns {string} Action text
 */
const getActionText = (type) => {
  switch (type) {
    case 'submission':
      return 'submitted a new post in';
    case 'announcement':
      return 'created an announcement in';
    case 'batch_join':
      return 'joined';
    default:
      return 'performed an action in';
  }
};

/**
 * Helper function to format timestamp
 * @param {string} timestamp - Database timestamp
 * @returns {string} Formatted timestamp
 */
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

module.exports = {
  getTeacherNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAllNotifications,
  createNotification,
  getNotificationSettings,
  updateNotificationSettings
};
