/**
 * User Controller
 * Handles user-related operations
 */

import type { Response, NextFunction } from 'express';
import { BaseController } from './BaseController.js';
import type { ServiceContainer } from '../services/index.js';
import type { AuthRequest } from '../types/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { InvalidFormatError } from '../errors/index.js';

export class UserController extends BaseController {
  constructor(services: ServiceContainer) {
    super(services);
  }

  /**
   * GET /api/users/search
   * Searches for users
   */
  searchUsers = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const query = this.getOptionalStringQuery(req, 'q');
    if (!query) {
      throw new Error('Search query parameter "q" is required');
    }

    const { page, limit } = this.getPaginationParams(req);
    
    const result = await this.services.userService.searchUsers(query, { page, limit });
    
    this.sendPaginated(res, result.users, result.total, page, limit);
  });

  /**
   * GET /api/users/:id
   * Gets user details by ID
   */
  getUserById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const idParam = req.params.id;
    
    // Special validation for common endpoint confusion
    if (idParam === 'stats') {
      throw new InvalidFormatError(
        'id',
        'positive integer. Did you mean /api/users/me/stats for your own statistics?',
        idParam
      );
    }
    
    const userId = this.getIdParam(req, 'id');
    
    const user = await this.services.userService.getUserById(userId);
    
    // Only return public information
    this.sendSuccess(res, {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    });
  });

  /**
   * GET /api/users/:id/stats
   * Gets user statistics
   */
  getUserStats = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const idParam = req.params.id;
    
    // Special validation for common endpoint confusion
    if (idParam === 'stats') {
      throw new InvalidFormatError(
        'id',
        'positive integer. Did you mean /api/users/me/stats for your own statistics?',
        idParam
      );
    }
    
    const userId = this.getIdParam(req, 'id');
    
    const stats = await this.services.userService.getUserStats(userId);
    
    this.sendSuccess(res, stats);
  });

  /**
   * POST /api/users/:id/follow
   * Follows a user
   */
  followUser = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const currentUserId = this.getUserId(req);
    const targetUserId = this.getIdParam(req, 'id');
    
    const follow = await this.services.userService.followUser(currentUserId, targetUserId);
    
    this.sendCreated(res, follow);
  });

  /**
   * DELETE /api/users/:id/follow
   * Unfollows a user
   */
  unfollowUser = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const currentUserId = this.getUserId(req);
    const targetUserId = this.getIdParam(req, 'id');
    
    await this.services.userService.unfollowUser(currentUserId, targetUserId);
    
    this.sendNoContent(res);
  });

  /**
   * POST /api/users/:id/block
   * Blocks a user
   */
  blockUser = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const currentUserId = this.getUserId(req);
    const targetUserId = this.getIdParam(req, 'id');
    
    const block = await this.services.userService.blockUser(currentUserId, targetUserId);
    
    this.sendCreated(res, block);
  });

  /**
   * DELETE /api/users/:id/block
   * Unblocks a user
   */
  unblockUser = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const currentUserId = this.getUserId(req);
    const targetUserId = this.getIdParam(req, 'id');
    
    await this.services.userService.unblockUser(currentUserId, targetUserId);
    
    this.sendNoContent(res);
  });

  /**
   * GET /api/users/:id/following-status
   * Checks if current user is following target user
   */
  getFollowingStatus = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const currentUserId = this.getUserId(req);
    const targetUserId = this.getIdParam(req, 'id');
    
    const isFollowing = await this.services.userService.isFollowing(currentUserId, targetUserId);
    const isBlocked = await this.services.userService.isBlocked(currentUserId, targetUserId);
    const isBlockedBy = await this.services.userService.isBlocked(targetUserId, currentUserId);
    
    this.sendSuccess(res, {
      isFollowing,
      isBlocked,
      isBlockedBy,
    });
  });

  /**
   * GET /api/users/me
   * Gets current user details
   */
  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    
    const user = await this.services.userService.getUserById(userId);
    
    this.sendSuccess(res, {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    });
  });

  /**
   * DELETE /api/users/me
   * Deletes current user account
   */
  deleteAccount = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    
    await this.services.userService.deleteUser(userId, userId);
    
    this.sendNoContent(res);
  });

  /**
   * GET /api/users/me/stats
   * Gets current user's statistics
   */
  getCurrentUserStats = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    
    const stats = await this.services.userService.getUserStats(userId);
    
    this.sendSuccess(res, stats);
  });
}