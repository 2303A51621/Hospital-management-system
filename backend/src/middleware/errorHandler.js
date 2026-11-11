// Error handling middleware
exports.errorHandler = (err, req, res, next) => {
  const status = err.code === 11000 ? 409 : (err.code === 'LIMIT_FILE_SIZE' ? 413 : (err.status || 500));
  let message = err.message || 'Internal Server Error';

  if (err.code === 'LIMIT_FILE_SIZE') message = 'Files must be 8 MB or smaller';

  if (err.code === 11000) {
    const duplicateFields = Object.keys(err.keyPattern || err.keyValue || {});
    if (duplicateFields.includes('email')) {
      message = 'An account with this email already exists. Please use another email or sign in.';
    } else if (duplicateFields.includes('phone')) {
      message = 'An account with this phone number already exists. Please use another number.';
    } else {
      message = 'An account with these details already exists.';
    }
  }

  console.error(`Error [${status}]: ${message}`);

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 handler
exports.notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  res.status(404);
  next(error);
};
