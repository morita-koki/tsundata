/**
 * Unified Authentication Middleware
 * Handles Firebase token verification and user synchronization
 */

import type { Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { users } from '../models/index.js';
import { eq } from 'drizzle-orm';
import { verifyFirebaseToken } from '../config/firebase.js';
import {
  TokenMissingError,
  TokenInvalidError,
  FirebaseAuthError,
  DatabaseError,
} from '../errors/index.js';
import type { 
  AuthenticatedUser, 
  FirebaseTokenPayload, 
  AuthRequest 
} from '../types/auth.js';
import type { UserInsert } from '../types/database.js';

/**
 * Extracts Bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new TokenMissingError('Authorization header is missing');
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
    throw new TokenInvalidError('Authorization header must be in format: Bearer <token>');
  }
  
  const token = parts[1];
  if (!token || token.trim() === '') {
    throw new TokenMissingError('Bearer token is empty');
  }
  
  return token;
}

/**
 * Finds user by Firebase UID or creates a new user
 */
async function findOrCreateUser(firebaseToken: FirebaseTokenPayload): Promise<AuthenticatedUser> {
  try {
    // First, try to find existing user
    const existingUsers = await db
      .select({
        id: users.id,
        firebaseUid: users.firebaseUid,
        username: users.username,
        email: users.email,
      })
      .from(users)
      .where(eq(users.firebaseUid, firebaseToken.uid))
      .limit(1);

    if (existingUsers.length > 0) {
      return existingUsers[0] as AuthenticatedUser;
    }

    // User doesn't exist, create new user
    if (!firebaseToken.email || firebaseToken.email === '') {
      throw new FirebaseAuthError('Firebase token is missing email address');
    }

    const newUserData: UserInsert = {
      firebaseUid: firebaseToken.uid,
      username: (firebaseToken.name ?? firebaseToken.email!.split('@')[0]) as string,
      email: firebaseToken.email!,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newUsers = await db
      .insert(users)
      .values(newUserData)
      .returning({
        id: users.id,
        firebaseUid: users.firebaseUid,
        username: users.username,
        email: users.email,
      });

    if (newUsers.length === 0) {
      throw new DatabaseError('Failed to create new user');
    }

    return newUsers[0] as AuthenticatedUser;
  } catch (error) {
    if (error instanceof FirebaseAuthError || error instanceof DatabaseError) {
      throw error;
    }
    
    // Handle database constraint errors
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      if (error.message.includes('email')) {
        throw new DatabaseError(
          `User with email ${firebaseToken.email} already exists`,
          error
        );
      } else if (error.message.includes('firebase_uid')) {
        throw new DatabaseError(
          `User with Firebase UID ${firebaseToken.uid} already exists`,
          error
        );
      }
    }
    
    throw new DatabaseError('Database error during user creation/lookup', error as Error);
  }
}

/**
 * Main authentication middleware
 * Verifies Firebase token and attaches user info to request
 */
export async function authenticateToken(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = (req as any).headers.authorization;
    const token = extractBearerToken(authHeader);

    // Verify Firebase token
    const firebaseToken = await verifyFirebaseToken(token);

    // Find or create user in database
    const user = await findOrCreateUser(firebaseToken);

    // Attach user and Firebase token to request
    req.user = user;
    req.firebaseToken = firebaseToken;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is provided, but doesn't fail if missing
 */
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = (req as any).headers.authorization;
    
    // If no auth header, just continue without authentication
    if (!authHeader) {
      return next();
    }

    // Try to authenticate, but don't fail if token is invalid
    try {
      const token = extractBearerToken(authHeader);
      const firebaseToken = await verifyFirebaseToken(token);
      const user = await findOrCreateUser(firebaseToken);
      
      req.user = user;
      req.firebaseToken = firebaseToken;
    } catch (authError) {
      // Log the error but don't fail the request
      console.warn('Optional authentication failed:', authError);
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-based authorization middleware
 * Requires authentication and checks user permissions
 */
export function requireRole(roles: string[]) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new TokenMissingError('Authentication required');
      }

      // For now, all authenticated users have 'user' role
      // This can be extended when role-based access control is implemented
      const userRole = 'user';
      
      if (!roles.includes(userRole)) {
        throw new TokenInvalidError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Resource ownership middleware
 * Checks if the authenticated user owns the specified resource
 */
export function requireOwnership(resourceIdParam: string = 'id') {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new TokenMissingError('Authentication required');
      }

      const resourceId = (req as any).params[resourceIdParam];
      const userId = req.user.id;

      // This is a simplified ownership check
      // In a real application, you would query the database to verify ownership
      // For now, we'll just ensure the user is authenticated
      
      if (!resourceId) {
        throw new TokenInvalidError(`Resource ID parameter '${resourceIdParam}' is required`);
      }

      // Store resource info for potential use in route handlers
      req.resourceId = parseInt(resourceId, 10);
      req.ownerId = userId;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Extends AuthRequest to include additional fields for resource ownership
 */
declare global {
  namespace Express {
    interface Request {
      resourceId?: number;
      ownerId?: number;
    }
  }
}