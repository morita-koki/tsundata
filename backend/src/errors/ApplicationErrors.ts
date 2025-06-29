/**
 * Application-specific business logic errors
 */

import { BaseError } from './BaseError.js';
import { HttpStatusCode } from '../types/common.js';

export class BusinessLogicError extends BaseError {
  constructor(message: string, details?: any) {
    super(message, HttpStatusCode.UNPROCESSABLE_ENTITY, true, details);
  }
}

export class ConfigurationError extends BaseError {
  public readonly configKey?: string | undefined;

  constructor(message: string, configKey?: string, details?: any) {
    super(message, HttpStatusCode.INTERNAL_SERVER_ERROR, false, details);
    this.configKey = configKey;
  }
}

export class EnvironmentVariableError extends ConfigurationError {
  constructor(variableName: string) {
    super(`Required environment variable is missing: ${variableName}`, variableName);
  }
}

export class InternalServerError extends BaseError {
  constructor(message: string = 'Internal server error', originalError?: Error) {
    super(message, HttpStatusCode.INTERNAL_SERVER_ERROR, false, { originalError });
  }
}

export class ServiceUnavailableError extends BaseError {
  public readonly serviceName?: string | undefined;
  public readonly retryAfter?: number | undefined;

  constructor(serviceName?: string, retryAfter?: number, details?: any) {
    const message = serviceName
      ? `${serviceName} service is temporarily unavailable`
      : 'Service temporarily unavailable';
    
    super(message, HttpStatusCode.SERVICE_UNAVAILABLE, true, details);
    
    this.serviceName = serviceName;
    this.retryAfter = retryAfter;
  }
}

// Bookshelf-specific business logic errors
export class BookAlreadyReadError extends BusinessLogicError {
  constructor(bookTitle: string) {
    super(`Book "${bookTitle}" is already marked as read`);
  }
}

export class BookNotInLibraryError extends BusinessLogicError {
  constructor(isbn: string) {
    super(`Book with ISBN ${isbn} is not in your library`);
  }
}

export class BookshelfFullError extends BusinessLogicError {
  public readonly maxBooks: number;

  constructor(maxBooks: number) {
    super(`Bookshelf is full. Maximum ${maxBooks} books allowed`);
    this.maxBooks = maxBooks;
  }
}

export class PrivateBookshelfError extends BusinessLogicError {
  constructor(bookshelfName: string) {
    super(`Bookshelf "${bookshelfName}" is private and cannot be accessed`);
  }
}

export class SelfFollowError extends BusinessLogicError {
  constructor() {
    super('Cannot follow yourself');
  }
}

export class AlreadyFollowingError extends BusinessLogicError {
  constructor(username: string) {
    super(`Already following user "${username}"`);
  }
}

export class NotFollowingError extends BusinessLogicError {
  constructor(username: string) {
    super(`Not following user "${username}"`);
  }
}

export class UserBlockedError extends BusinessLogicError {
  constructor(username: string) {
    super(`User "${username}" has been blocked`);
  }
}

export class BlockedByUserError extends BusinessLogicError {
  constructor(username: string) {
    super(`You have been blocked by user "${username}"`);
  }
}