/**
 * Authentication Controller
 * Handles user authentication and profile synchronization
 */

import type { Response, NextFunction } from 'express';
import { BaseController } from './BaseController.js';
import type { ServiceContainer } from '../services/index.js';
import type { AuthRequest } from '../types/auth.js';
import type { AuthSyncResponse } from '../types/api.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export class AuthController extends BaseController {
  constructor(services: ServiceContainer) {
    super(services);
  }

  /**
   * POST /api/auth/sync
   * Synchronizes Firebase user with local database
   */
  syncUser = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const user = this.getAuthenticatedUser(req);
    const firebaseToken = req.firebaseToken;

    if (!firebaseToken) {
      throw new Error('Firebase token not found in request');
    }

    // User is already authenticated and synchronized by middleware
    // Just return the user information
    const response: AuthSyncResponse = {
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        username: user.username,
        email: user.email,
      },
      firebaseUser: {
        uid: firebaseToken.uid,
        email: firebaseToken.email,
        name: firebaseToken.name ?? undefined,
      },
    };

    this.sendSuccess(res, response);
  });

  /**
   * GET /api/auth/me
   * Gets current user profile
   */
  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const user = this.getAuthenticatedUser(req);
    
    // Get full user details
    const fullUser = await this.services.userService.getUserById(user.id);
    
    this.sendSuccess(res, {
      id: fullUser.id,
      firebaseUid: fullUser.firebaseUid,
      username: fullUser.username,
      email: fullUser.email,
      createdAt: fullUser.createdAt,
      updatedAt: fullUser.updatedAt,
    });
  });

  /**
   * PUT /api/auth/profile
   * Updates current user profile
   */
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    this.validateRequestBody(req.body);

    const { username, email } = req.body as { username?: string; email?: string; };
    const updates: any = {};

    if (username !== undefined) {
      updates.username = username;
    }
    if (email !== undefined) {
      updates.email = email;
    }

    const updatedUser = await this.services.userService.updateUser(userId, updates, userId);

    this.sendSuccess(res, {
      id: updatedUser.id,
      firebaseUid: updatedUser.firebaseUid,
      username: updatedUser.username,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  });
}