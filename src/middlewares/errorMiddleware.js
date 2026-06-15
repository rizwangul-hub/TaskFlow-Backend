import { ApiError } from '../utils/apiError.js';
import logger from '../utils/logger.js';

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // If the error is not an instance of custom ApiError, wrap it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  const logMessage = `${req.method} ${req.originalUrl || req.url} - ${error.statusCode} - ${error.message}`;

  if (error.statusCode >= 500) {
    logger.error(`${logMessage}\nStack: ${error.stack || "No Stack Trace"}`);
  } else {
    logger.warn(logMessage);
  }

  const response = {
    success: false,
    message: error.message,
    ...(error.errors && error.errors.length > 0 ? { errors: error.errors } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
  };

  res.status(error.statusCode).json(response);
};

export { errorMiddleware };
export default errorMiddleware;
