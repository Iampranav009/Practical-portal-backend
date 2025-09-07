const express = require('express');
const { registerUser, getUserByFirebaseUid, googleSignIn, emailSignIn, logout } = require('../controllers/authController');
const { authRateLimit, validateRegistration, validateLogin } = require('../middleware/validation');

const router = express.Router();

/**
 * Authentication Routes
 * Handles user registration and authentication endpoints
 */

// POST /api/auth/register
// Register new user after Firebase authentication
router.post('/register', authRateLimit, validateRegistration, registerUser);

// GET /api/auth/user/:firebaseUid
// Get user information by Firebase UID
router.get('/user/:firebaseUid', getUserByFirebaseUid);

// POST /api/auth/google-signin
// Handle Google Sign In with role selection
router.post('/google-signin', authRateLimit, googleSignIn);

// POST /api/auth/signin
// Handle email/password sign in with role-specific validation
router.post('/signin', authRateLimit, validateLogin, emailSignIn);

// POST /api/auth/logout
// Handle user logout and clear cookies
router.post('/logout', logout);

// GET /api/auth/test
// Test endpoint to verify API connectivity
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working properly',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
