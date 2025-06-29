/**
 * Authentication and Authorization types
 */

import type { User } from './database.js';

// Firebase token payload
export interface FirebaseTokenPayload {
  uid: string;
  email: string;
  name?: string | undefined;
  picture?: string | undefined;
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string;
  sub: string;
  iat: number;
  exp: number;
  email_verified?: boolean | undefined;
  firebase: {
    identities: {
      email: string[];
    };
    sign_in_provider: string;
  };
}

// Authenticated user context (attached to Express request)
export interface AuthenticatedUser {
  id: number;
  firebaseUid: string;
  username: string;
  email: string;
}

// JWT payload (if we use JWT tokens)
export interface JwtPayload {
  userId: number;
  firebaseUid: string;
  email: string;
  iat: number;
  exp: number;
}

// Authentication middleware types
import type { Request } from 'express';

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  firebaseToken?: FirebaseTokenPayload;
}

// Authentication errors
export enum AuthErrorCode {
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_MISSING = 'TOKEN_MISSING',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
}

export interface AuthError extends Error {
  code: AuthErrorCode;
  statusCode: number;
}

// Role-based access control (for future use)
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export interface UserWithRole extends User {
  role: UserRole;
}

// Permission types (for future use)
export enum Permission {
  READ_BOOKS = 'read:books',
  WRITE_BOOKS = 'write:books',
  READ_BOOKSHELVES = 'read:bookshelves',
  WRITE_BOOKSHELVES = 'write:bookshelves',
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  ADMIN_PANEL = 'admin:panel',
}

// Authorization context
export interface AuthContext {
  user: AuthenticatedUser;
  permissions: Permission[];
  role: UserRole;
}