/**
 * External API related errors
 */

import { BaseError } from './BaseError.js';
import { HttpStatusCode } from '../types/common.js';

export class ExternalApiError extends BaseError {
  public readonly apiName: string;
  public readonly endpoint?: string | undefined;
  public readonly originalError?: Error | undefined;

  constructor(
    apiName: string,
    message: string,
    endpoint?: string,
    originalError?: Error,
    details?: any
  ) {
    super(message, HttpStatusCode.SERVICE_UNAVAILABLE, true, details);
    
    this.apiName = apiName;
    this.endpoint = endpoint;
    this.originalError = originalError;
  }
}

export class ApiTimeoutError extends ExternalApiError {
  constructor(apiName: string, endpoint?: string, timeout?: number) {
    const message = `${apiName} API request timed out${timeout ? ` after ${timeout}ms` : ''}`;
    super(apiName, message, endpoint);
  }
}

export class ApiRateLimitError extends ExternalApiError {
  public readonly retryAfter?: number | undefined;

  constructor(apiName: string, retryAfter?: number, endpoint?: string) {
    const message = `${apiName} API rate limit exceeded${
      retryAfter ? `. Retry after ${retryAfter} seconds` : ''
    }`;
    super(apiName, message, endpoint);
    this.retryAfter = retryAfter;
  }
}

export class ApiAuthenticationError extends ExternalApiError {
  constructor(apiName: string, endpoint?: string) {
    const message = `${apiName} API authentication failed`;
    super(apiName, message, endpoint);
  }
}

export class ApiQuotaExceededError extends ExternalApiError {
  constructor(apiName: string, endpoint?: string) {
    const message = `${apiName} API quota exceeded`;
    super(apiName, message, endpoint);
  }
}

// Specific API errors
export class GoogleBooksApiError extends ExternalApiError {
  constructor(message: string, statusCode: HttpStatusCode = HttpStatusCode.SERVICE_UNAVAILABLE, originalError?: Error, endpoint?: string) {
    super('Google Books API', message, endpoint, originalError);
    // Override the base class statusCode by updating it
    (this as any).statusCode = statusCode;
  }
}

export class NdlApiError extends ExternalApiError {
  constructor(message: string, endpoint?: string, originalError?: Error) {
    super('NDL API', message, endpoint, originalError);
  }
}

export class BookSearchError extends BaseError {
  public readonly isbn: string;
  public readonly searchErrors: ExternalApiError[];

  constructor(isbn: string, searchErrors: ExternalApiError[] = []) {
    const message = `Failed to find book information for ISBN: ${isbn}`;
    super(message, HttpStatusCode.NOT_FOUND, true, { isbn, searchErrors });
    
    this.isbn = isbn;
    this.searchErrors = searchErrors;
  }
}

export class InvalidIsbnError extends BaseError {
  public readonly isbn: string;

  constructor(isbn: string) {
    const message = `Invalid ISBN format: ${isbn}`;
    super(message, HttpStatusCode.BAD_REQUEST, true, { isbn });
    
    this.isbn = isbn;
  }
}