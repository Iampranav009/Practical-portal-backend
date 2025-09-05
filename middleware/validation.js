const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');

/**
 * Security and Validation Middleware
 * Provides input validation, sanitization, and rate limiting
 * Protects against common security vulnerabilities
 */

/**
 * Rate limiting middleware
 * Prevents brute force attacks and API abuse
 */
const createRateLimit = (windowMs, max, message = 'Too many requests') => {
  return rateLimit({
    windowMs, // Time window in milliseconds
    max, // Limit each IP to max requests per windowMs
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false,
    // Skip rate limiting for successful requests in some cases
    skipSuccessfulRequests: false,
    // Skip rate limiting for failed requests (optional)
    skipFailedRequests: false,
  });
};

// Rate limiting configurations
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per 15 minutes
  'Too many authentication attempts, please try again later'
);

const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per 15 minutes
  'Too many API requests, please try again later'
);

const uploadRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 uploads per minute
  'Too many file uploads, please try again later'
);

/**
 * Validation error handler
 * Processes validation results and returns formatted errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * User registration validation
 */
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name must be 2-50 characters and contain only letters and spaces'),
  
  body('role')
    .isIn(['student', 'teacher'])
    .withMessage('Role must be either student or teacher'),
  
  body('firebaseUid')
    .isLength({ min: 1 })
    .withMessage('Firebase UID is required'),
  
  handleValidationErrors
];

/**
 * User login validation
 * Note: Password validation is handled by Firebase, not our backend
 */
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  handleValidationErrors
];

/**
 * Profile update validation - Role-specific validation
 * Validates fields based on user role (teacher vs student)
 */
const validateProfileUpdate = [
  // Custom validation middleware that handles both common and role-specific validation
  (req, res, next) => {
    const { role } = req.user; // Get role from JWT token
    const errors = [];
    
    // Debug logging
    console.log('Profile validation - Role:', role);
    console.log('Profile validation - Body:', req.body);
    
    // Common validation for all users
    const { name, profilePictureUrl } = req.body;
    
    // Validate name
    if (!name || typeof name !== 'string') {
      errors.push({
        path: 'name',
        msg: 'Name is required',
        value: name
      });
    } else {
      const trimmedName = name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        errors.push({
          path: 'name',
          msg: 'Name must be 2-50 characters',
          value: name
        });
      } else if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
        errors.push({
          path: 'name',
          msg: 'Name must contain only letters and spaces',
          value: name
        });
      }
    }
    
    // Validate profile picture URL
    if (profilePictureUrl !== undefined && profilePictureUrl !== null && profilePictureUrl !== '') {
      try {
        new URL(profilePictureUrl);
      } catch {
        errors.push({
          path: 'profilePictureUrl',
          msg: 'Profile picture must be a valid URL or empty',
          value: profilePictureUrl
        });
      }
    }
    
    // Role-specific validation
    if (role === 'teacher') {
      // Teacher-specific validation
      if (req.body.collegeName !== undefined) {
        const collegeName = req.body.collegeName?.trim();
        if (collegeName && (collegeName.length < 2 || collegeName.length > 100)) {
          errors.push({
            path: 'collegeName',
            msg: 'College name must be 2-100 characters',
            value: req.body.collegeName
          });
        }
      }
      
      if (req.body.contactNumber !== undefined) {
        const contactNumber = req.body.contactNumber?.trim();
        if (contactNumber && !/^[\+]?[0-9\s\-\(\)]{7,20}$/.test(contactNumber)) {
          errors.push({
            path: 'contactNumber',
            msg: 'Contact number must be a valid phone number (7-20 digits)',
            value: req.body.contactNumber
          });
        }
      }
      
    } else if (role === 'student') {
      // Student-specific validation
      if (!req.body.year || !['First Year', 'Second Year', 'Third Year', 'Fourth Year'].includes(req.body.year)) {
        errors.push({
          path: 'year',
          msg: 'Invalid academic year',
          value: req.body.year
        });
      }
      
      if (!req.body.subject || req.body.subject.trim().length < 2 || req.body.subject.trim().length > 100) {
        errors.push({
          path: 'subject',
          msg: 'Subject must be 2-100 characters',
          value: req.body.subject
        });
      }
      
      if (req.body.batchName !== undefined && req.body.batchName.trim().length > 50) {
        errors.push({
          path: 'batchName',
          msg: 'Batch name must be less than 50 characters',
          value: req.body.batchName
        });
      }
      
      if (!req.body.rollNumber || !/^[A-Za-z0-9\-_]+$/.test(req.body.rollNumber) || req.body.rollNumber.length < 1 || req.body.rollNumber.length > 50) {
        errors.push({
          path: 'rollNumber',
          msg: 'Roll number must be 1-50 characters and contain only letters, numbers, hyphens, and underscores',
          value: req.body.rollNumber
        });
      }
      
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role'
      });
    }
    
    // Handle validation errors
    if (errors.length > 0) {
      console.log('Final validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    
    next();
  }
];

/**
 * Batch creation validation
 */
const validateBatchCreation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Batch name must be 3-100 characters and contain only letters, numbers, spaces, hyphens, and underscores'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  body('code')
    .optional()
    .trim()
    .matches(/^[A-Z0-9]{6,10}$/)
    .withMessage('Batch code must be 6-10 uppercase letters and numbers'),
  
  handleValidationErrors
];

/**
 * Submission creation validation
 */
const validateSubmissionCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be 3-200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('batchId')
    .isInt({ min: 1 })
    .withMessage('Valid batch ID is required'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Content must be less than 5000 characters'),
  
  handleValidationErrors
];

/**
 * Announcement validation
 */
const validateAnnouncement = [
  body('batch_id')
    .isInt({ min: 1 })
    .withMessage('Valid batch ID is required'),
  
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be 1-1000 characters'),
  
  handleValidationErrors
];

/**
 * Parameter validation for IDs
 */
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  handleValidationErrors
];

const validateBatchId = [
  param('batch_id')
    .isInt({ min: 1 })
    .withMessage('Batch ID must be a positive integer'),
  
  handleValidationErrors
];

const validateSubmissionId = [
  param('submission_id')
    .isInt({ min: 1 })
    .withMessage('Submission ID must be a positive integer'),
  
  handleValidationErrors
];

/**
 * Query parameter validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

/**
 * Role-based access control
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'User role not found'
      });
    }
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    
    next();
  };
};

/**
 * Sanitize request body
 * Removes potentially dangerous characters
 */
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Remove script tags and other potentially dangerous content
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else {
          obj[key] = sanitizeValue(obj[key]);
        }
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }
  
  next();
};

/**
 * Content Security Policy headers
 */
const setSecurityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https:; " +
    "font-src 'self' https:; " +
    "object-src 'none'; " +
    "media-src 'self'; " +
    "frame-src 'none';"
  );
  
  next();
};

module.exports = {
  // Rate limiting
  authRateLimit,
  apiRateLimit,
  uploadRateLimit,
  
  // Validation middleware
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateBatchCreation,
  validateSubmissionCreation,
  validateAnnouncement,
  validateId,
  validateBatchId,
  validateSubmissionId,
  validatePagination,
  
  // Security middleware
  requireRole,
  sanitizeInput,
  setSecurityHeaders,
  handleValidationErrors
};
