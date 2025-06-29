/**
 * Unified Error Handling Middleware
 * Catches all errors and formats them consistently for API responses
 */

import type { Request, Response, NextFunction } from 'express';
import { 
  BaseError, 
  isOperationalError, 
  formatErrorForClient, 
  formatErrorForLogging,
  InternalServerError 
} from '../errors/index.js';
import { HttpStatusCode } from '../types/common.js';

// Logger interface (to be implemented with actual logging library later)
interface Logger {
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
}

// Simple console logger for now
const logger: Logger = {
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
  info: (message: string, meta?: any) => {
    console.info(`[INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
  },
};

/**
 * Creates request context for logging
 */
function createRequestContext(req: Request) {
  return {
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || generateRequestId(),
  };
}

/**
 * Generates a simple request ID for tracking
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Determines if error details should be exposed to client
 */
function shouldExposeErrorDetails(error: Error, nodeEnv: string): boolean {
  // In development, expose all error details
  if (nodeEnv === 'development') {
    return true;
  }
  
  // In production, only expose operational errors
  return isOperationalError(error);
}

/**
 * Main error handling middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestContext = createRequestContext(req);
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Ensure we have a proper error object
  let processedError: BaseError;
  
  if (error instanceof BaseError) {
    processedError = error;
  } else {
    // Convert unknown errors to InternalServerError
    processedError = new InternalServerError('An unexpected error occurred', error);
  }

  // Log the error with context
  const logData = formatErrorForLogging(processedError, requestContext);
  
  if (processedError.isOperational) {
    logger.warn('Operational error occurred', logData);
  } else {
    logger.error('Non-operational error occurred', logData);
  }

  // Don't send response if headers are already sent
  if (res.headersSent) {
    return next(processedError);
  }

  // Determine response format
  const shouldExpose = shouldExposeErrorDetails(processedError, nodeEnv);
  let responseData: any;

  if (shouldExpose) {
    responseData = formatErrorForClient(processedError);
  } else {
    // Generic error response for non-operational errors in production
    responseData = {
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
    };
  }

  // Add request ID to response for debugging
  responseData.requestId = requestContext.requestId;

  // Set appropriate status code and send response
  res.status(processedError.statusCode).json(responseData);
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error middleware
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 * Should be used as the last middleware before error handler
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const error = new (class extends BaseError {})(
    `Route ${req.method} ${req.originalUrl} not found`,
    HttpStatusCode.NOT_FOUND
  );
  next(error);
}

/**
 * Process uncaught exceptions and unhandled rejections
 */
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception - shutting down gracefully', 
      formatErrorForLogging(error, { type: 'uncaughtException' })
    );
    
    // Give some time for logging before exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection - shutting down gracefully', {
      reason: reason instanceof Error ? formatErrorForLogging(reason) : reason,
      promise: promise.toString(),
      type: 'unhandledRejection'
    });
    
    // Give some time for logging before exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(): void {
  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    
    // Close server and database connections here
    // server.close(() => {
    //   logger.info('Process terminated');
    //   process.exit(0);
    // });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}