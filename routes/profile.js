const express = require('express');
const { getProfile, updateProfile, createOrUpdateProfile } = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');
const { validateProfileUpdate } = require('../middleware/validation');

const router = express.Router();

/**
 * Profile Routes
 * Handles user profile management endpoints
 * All routes require JWT authentication
 */

// GET /api/profile
// Get current user's profile
router.get('/', authenticateToken, getProfile);

// POST /api/profile
// Create or update current user's profile
router.post('/', authenticateToken, validateProfileUpdate, createOrUpdateProfile);

// PUT /api/profile
// Update current user's profile (legacy endpoint)
router.put('/', authenticateToken, validateProfileUpdate, updateProfile);

module.exports = router;
