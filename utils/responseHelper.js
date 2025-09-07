/**
 * Standardized API Response Helper
 * Provides consistent response formats across all API endpoints
 * Ensures uniform error handling and success responses
 */

/**
 * Send standardized success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message
 * @param {Object} data - Response data (optional)
 * @param {Object} meta - Additional metadata (optional)
 */
const sendSuccessResponse = (res, statusCode = 200, message, data = null, meta = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send standardized error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} details - Additional error details (optional)
 * @param {string} errorCode - Custom error code (optional)
 */
const sendErrorResponse = (res, statusCode, message, details = null, errorCode = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (details !== null) {
    response.details = details;
  }

  if (errorCode !== null) {
    response.errorCode = errorCode;
  }

  return res.status(statusCode).json(response);
};

/**
 * Handle validation errors from express-validator
 * @param {Object} res - Express response object
 * @param {Object} errors - Validation errors from express-validator
 */
const handleValidationErrors = (res, errors) => {
  const formattedErrors = errors.array().map(error => ({
    field: error.path,
    message: error.msg,
    value: error.value
  }));

  return sendErrorResponse(
    res,
    400,
    'Validation failed',
    { validationErrors: formattedErrors },
    'VALIDATION_ERROR'
  );
};

/**
 * Handle database errors
 * @param {Object} res - Express response object
 * @param {Error} error - Database error
 */
const handleDatabaseError = (res, error) => {
  console.error('Database error:', error);
  
  // Don't expose internal database errors to client
  return sendErrorResponse(
    res,
    500,
    'Database operation failed',
    null,
    'DATABASE_ERROR'
  );
};

/**
 * Handle authentication errors
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const handleAuthError = (res, message = 'Authentication failed') => {
  return sendErrorResponse(
    res,
    401,
    message,
    null,
    'AUTH_ERROR'
  );
};

/**
 * Handle authorization errors
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
const handleAuthorizationError = (res, message = 'Access denied') => {
  return sendErrorResponse(
    res,
    403,
    message,
    null,
    'AUTHORIZATION_ERROR'
  );
};

/**
 * Handle not found errors
 * @param {Object} res - Express response object
 * @param {string} resource - Resource that was not found
 */
const handleNotFoundError = (res, resource = 'Resource') => {
  return sendErrorResponse(
    res,
    404,
    `${resource} not found`,
    null,
    'NOT_FOUND'
  );
};

/**
 * Handle rate limit errors
 * @param {Object} res - Express response object
 * @param {string} message - Rate limit message
 */
const handleRateLimitError = (res, message = 'Too many requests') => {
  return sendErrorResponse(
    res,
    429,
    message,
    null,
    'RATE_LIMIT_EXCEEDED'
  );
};

/**
 * Handle server errors
 * @param {Object} res - Express response object
 * @param {Error} error - Server error
 * @param {string} message - Custom error message
 */
const handleServerError = (res, error, message = 'Internal server error') => {
  console.error('Server error:', error);
  
  return sendErrorResponse(
    res,
    500,
    message,
    null,
    'SERVER_ERROR'
  );
};

module.exports = {
  sendSuccessResponse,
  sendErrorResponse,
  handleValidationErrors,
  handleDatabaseError,
  handleAuthError,
  handleAuthorizationError,
  handleNotFoundError,
  handleRateLimitError,
  handleServerError
};
