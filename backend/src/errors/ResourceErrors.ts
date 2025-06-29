/**
 * Resource-related errors (CRUD operations)
 */

import { BaseError } from './BaseError.js';
import { HttpStatusCode } from '../types/common.js';

export class ResourceNotFoundError extends BaseError {
  public readonly resourceType: string;
  public readonly resourceId: string | number;

  constructor(resourceType: string, resourceId: string | number, details?: any) {
    const message = `${resourceType} with ID ${resourceId} not found`;
    super(message, HttpStatusCode.NOT_FOUND, true, details);
    
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

export class ResourceConflictError extends BaseError {
  public readonly resourceType: string;
  public readonly conflictField?: string | undefined;

  constructor(
    resourceType: string,
    message?: string,
    conflictField?: string,
    details?: any
  ) {
    const defaultMessage = message || `${resourceType} already exists`;
    super(defaultMessage, HttpStatusCode.CONFLICT, true, details);
    
    this.resourceType = resourceType;
    this.conflictField = conflictField;
  }
}

export class ResourceOwnershipError extends BaseError {
  public readonly resourceType: string;
  public readonly resourceId: string | number;
  public readonly userId: number;

  constructor(resourceType: string, resourceId: string | number, userId: number) {
    const message = `User ${userId} does not own ${resourceType} ${resourceId}`;
    super(message, HttpStatusCode.FORBIDDEN, true);
    
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    this.userId = userId;
  }
}

export class ResourceConstraintError extends BaseError {
  public readonly resourceType: string;
  public readonly constraint: string;

  constructor(resourceType: string, constraint: string, details?: any) {
    const message = `Cannot perform operation on ${resourceType}: ${constraint}`;
    super(message, HttpStatusCode.UNPROCESSABLE_ENTITY, true, details);
    
    this.resourceType = resourceType;
    this.constraint = constraint;
  }
}

// Specific resource errors
export class UserNotFoundError extends ResourceNotFoundError {
  constructor(userId: string | number) {
    super('User', userId);
  }
}

export class BookNotFoundError extends ResourceNotFoundError {
  constructor(bookId: string | number) {
    super('Book', bookId);
  }
}

export class BookshelfNotFoundError extends ResourceNotFoundError {
  constructor(bookshelfId: string | number) {
    super('Bookshelf', bookshelfId);
  }
}

export class UserBookNotFoundError extends ResourceNotFoundError {
  constructor(userBookId: string | number) {
    super('UserBook', userBookId);
  }
}

export class DuplicateBookError extends ResourceConflictError {
  constructor(isbn: string) {
    super('Book', `Book with ISBN ${isbn} already exists`, 'isbn', { isbn });
  }
}

export class DuplicateUserBookError extends ResourceConflictError {
  constructor(userId: number, bookId: number) {
    super(
      'UserBook',
      'Book is already in your library',
      'user_book',
      { userId, bookId }
    );
  }
}

export class BookshelfBookAlreadyExistsError extends ResourceConflictError {
  constructor(bookshelfId: number, userBookId: number) {
    super(
      'BookshelfBook',
      'Book is already in this bookshelf',
      'bookshelf_book',
      { bookshelfId, userBookId }
    );
  }
}