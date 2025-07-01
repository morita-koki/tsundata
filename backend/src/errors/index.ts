/**
 * Error classes index
 * Re-exports all custom error classes for easy importing
 */

// Base error
export * from './BaseError.js';
import { BaseError } from './BaseError.js';

// Authentication and Authorization errors
export * from './AuthenticationErrors.js';

// Validation errors
export * from './ValidationErrors.js';

// Resource errors
export * from './ResourceErrors.js';

// External API errors
export * from './ExternalApiErrors.js';

// Database errors
export * from './DatabaseErrors.js';

// Application-specific errors
export * from './ApplicationErrors.js';

// Error utility functions
export function isOperationalError(error: Error): boolean {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
}

export function getErrorStatusCode(error: Error): number {
  if (error instanceof BaseError) {
    return error.statusCode;
  }
  return 500; // Default to internal server error
}

export function formatErrorForClient(error: Error) {
  if (error instanceof BaseError) {
    return error.toClientJSON();
  }
  
  // For non-custom errors, return a generic error message
  return {
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    statusCode: 500,
    timestamp: new Date().toISOString(),
  };
}

export function formatErrorForLogging(error: Error, context?: any) {
  if (error instanceof BaseError) {
    return {
      ...error.toJSON(),
      context,
    };
  }
  
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  };
}