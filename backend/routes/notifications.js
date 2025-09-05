const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getTeacherNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAllNotifications,
  createNotification,
  getNotificationSettings,
  updateNotificationSettings
} = require('../controllers/notificationController');

/**
 * Notification Routes
 * Handles all notification-related API endpoints
 * All routes require authentication
 */

// Get all notifications for a teacher
router.get('/teacher/:teacherId', authenticateToken, getTeacherNotifications);

// Mark a specific notification as read
router.put('/:notificationId/read', authenticateToken, markNotificationAsRead);

// Mark all notifications as read for a teacher
router.put('/teacher/:teacherId/mark-all-read', authenticateToken, markAllNotificationsAsRead);

// Delete all notifications for a teacher
router.delete('/teacher/:teacherId/delete-all', authenticateToken, deleteAllNotifications);

// Create a new notification (internal use)
router.post('/', authenticateToken, createNotification);

// Get notification settings for a teacher
router.get('/settings/:teacherId', authenticateToken, getNotificationSettings);

// Update notification settings for a teacher
router.put('/settings/:teacherId', authenticateToken, updateNotificationSettings);

module.exports = router;
