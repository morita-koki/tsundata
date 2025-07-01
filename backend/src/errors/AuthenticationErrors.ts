/**
 * Authentication and Authorization related errors
 */

import { BaseError } from './BaseError.js';
import { HttpStatusCode } from '../types/common.js';

export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, HttpStatusCode.UNAUTHORIZED, true, details);
  }
}

export class TokenMissingError extends AuthenticationError {
  constructor(message: string = 'Authentication token is missing') {
    super(message);
  }
}

export class TokenInvalidError extends AuthenticationError {
  constructor(message: string = 'Authentication token is invalid', details?: any) {
    super(message, details);
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(message: string = 'Authentication token has expired') {
    super(message);
  }
}

export class FirebaseAuthError extends AuthenticationError {
  constructor(message: string = 'Firebase authentication failed', details?: any) {
    super(message, details);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, HttpStatusCode.FORBIDDEN, true, details);
  }
}

export class InsufficientPermissionsError extends AuthorizationError {
  constructor(resource: string, action: string) {
    super(`Insufficient permissions to ${action} ${resource}`);
  }
}