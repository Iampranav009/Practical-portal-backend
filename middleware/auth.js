const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens from Authorization header or cookies
 * Protects routes that require authentication
 */
const authenticateToken = (req, res, next) => {
  // Try to get token from Authorization header first
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  // Debug logging for 404 issues
  console.log('🔍 Auth Debug - URL:', req.url);
  console.log('🔍 Auth Debug - Method:', req.method);
  console.log('🔍 Auth Debug - Auth Header:', authHeader);
  
  // If no Authorization header, try to get token from cookies
  if (!token && req.cookies) {
    token = req.cookies.authToken || req.cookies.access_token;
  }

  if (!token) {
    console.log('❌ Auth Debug - No token found for:', req.url);
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  // Ensure JWT_SECRET is set for security
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('❌ JWT_SECRET environment variable is not set');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error'
    });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken
};
