const express = require('express');
const { registerUser, getUserByFirebaseUid, googleSignIn, emailSignIn, logout } = require('../controllers/authController');
const { authRateLimit, validateRegistration, validateLogin } = require('../middleware/validation');

const router = express.Router();

// CORS handling for auth routes specifically
router.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('🔐 Auth route CORS - Origin:', origin);
  
  // Set CORS headers for all auth routes
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 Auth preflight request for:', req.url);
    return res.status(200).end();
  }
  
  next();
});

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
