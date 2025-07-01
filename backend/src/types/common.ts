/**
 * Common utility types and extended Express types
 */

import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedUser, FirebaseTokenPayload } from './auth.js';

// Extended Express Request type with authentication
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      firebaseToken?: FirebaseTokenPayload;
    }
  }
}

// Common HTTP status codes
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

// Request handler types
export type RequestHandler<
  TRequest = any,
  TResponse = any,
  TParams = any,
  TQuery = any
> = (
  req: Request<TParams, TResponse, TRequest, TQuery>,
  res: Response<TResponse>,
  next: NextFunction
) => Promise<void> | void;

export type AuthenticatedRequestHandler<
  TRequest = any,
  TResponse = any,
  TParams = any,
  TQuery = any
> = (
  req: Request<TParams, TResponse, TRequest, TQuery> & { user: AuthenticatedUser },
  res: Response<TResponse>,
  next: NextFunction
) => Promise<void> | void;

// Middleware types
export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export type ErrorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Environment types
export interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  JWT_SECRET: string;
  DATABASE_URL: string;
  GOOGLE_BOOKS_API_KEY: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Database connection types
export interface DatabaseConfig {
  url: string;
  logging?: boolean;
  pool?: {
    min: number;
    max: number;
  };
}

// API versioning
export type ApiVersion = 'v1' | 'v2';

// Rate limiting
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

// Logging levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Structured logging
export interface LogContext {
  userId?: number;
  requestId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  error?: Error;
  [key: string]: any;
}