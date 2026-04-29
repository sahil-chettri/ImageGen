/**
 * Central error handler — catches anything passed to next(err)
 */
export function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Log error in development
  if (isDev) {
    console.error('\n[ERROR]', err.message);
    console.error(err.stack);
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `File too large. Max size is ${process.env.MAX_FILE_SIZE_MB || 5} MB.`,
    });
  }

  // Validation errors (express-validator)
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors:  err.errors,
    });
  }

  const status  = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
}