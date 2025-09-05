const express = require('express')
const router = express.Router()
const announcementController = require('../controllers/announcementController')
const { authenticateToken } = require('../middleware/auth')

/**
 * Announcement Routes
 * Handles all announcement-related API endpoints
 * All routes require authentication
 */

// Create a new announcement (Teacher only)
router.post('/', 
  authenticateToken, 
  (req, res, next) => {
    // Simple validation for now
    if (!req.body.batch_id || !req.body.message) {
      return res.status(400).json({
        success: false,
        message: 'Batch ID and message are required'
      })
    }
    next()
  },
  announcementController.createAnnouncement
)

// Get all announcements for a batch
router.get('/batch/:batch_id', 
  authenticateToken, 
  announcementController.getBatchAnnouncements
)

// Mark an announcement as read (Student only)
router.post('/:announcement_id/read', 
  authenticateToken, 
  announcementController.markAsRead
)

// Get unread announcement count for a student
router.get('/unread-count/:batch_id', 
  authenticateToken, 
  announcementController.getUnreadCount
)

// Delete an announcement (Teacher only)
router.delete('/:announcement_id', 
  authenticateToken, 
  announcementController.deleteAnnouncement
)

module.exports = router
