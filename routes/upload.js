const express = require('express');
const { 
  uploadProfilePicture, 
  deleteProfilePicture,
  uploadSubmissionFile
} = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Upload Routes
 * Handles base64 image upload operations
 * All routes require JWT authentication
 */

// POST /api/upload/profile-picture
// Upload a new profile picture (base64)
router.post('/profile-picture', authenticateToken, uploadProfilePicture);

// DELETE /api/upload/profile-picture
// Delete an existing profile picture
router.delete('/profile-picture', authenticateToken, deleteProfilePicture);

// POST /api/upload/submission-file
// Upload a file for submission (students only)
router.post('/submission-file', authenticateToken, uploadSubmissionFile);

module.exports = router;
