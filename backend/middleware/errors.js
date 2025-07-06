/**
 * Error handling middleware
 */

export const errorHandler = (err, req, res) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: 'Internal server error',
    error: 'INTERNAL_SERVER_ERROR'
  };

  // Supabase errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        error.message = 'Duplicate entry';
        error.error = 'DUPLICATE_ENTRY';
        break;
      case '23503': // Foreign key violation
        error.message = 'Referenced record not found';
        error.error = 'FOREIGN_KEY_VIOLATION';
        break;
      case '23514': // Check violation
        error.message = 'Data validation failed';
        error.error = 'CHECK_VIOLATION';
        break;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.error = 'INVALID_TOKEN';
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.error = 'TOKEN_EXPIRED';
    return res.status(401).json(error);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = err.message;
    error.error = 'VALIDATION_ERROR';
    return res.status(400).json(error);
  }

  res.status(500).json(error);
};

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'ROUTE_NOT_FOUND'
  });
};

export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] ${method} ${url} - ${ip}`);
  
  // Log request body for non-GET requests (excluding sensitive data)
  if (method !== 'GET' && req.body) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.otp) sanitizedBody.otp = '***';
    if (sanitizedBody.password) sanitizedBody.password = '***';
    console.log('Request body:', sanitizedBody);
  }
  
  next();
};
