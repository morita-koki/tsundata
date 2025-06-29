/**
 * Base Error class for custom application errors
 * Provides a foundation for all custom errors with consistent structure
 */

import type { HttpStatusCode } from '../types/common.js';

export abstract class BaseError extends Error {
  public override readonly name: string;
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: HttpStatusCode,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serializes the error for logging or API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      details: this.details,
      stack: this.stack,
    };
  }

  /**
   * Returns a client-safe version of the error (without stack trace)
   */
  toClientJSON() {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      details: this.details,
    };
  }
}