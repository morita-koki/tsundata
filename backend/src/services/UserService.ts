/**
 * User Service
 * Handles user-related business logic
 */

import { BaseService } from './BaseService.js';
import type { RepositoryContainer } from '../repositories/index.js';
import type { 
  User, 
  UserInsert, 
  UserUpdate, 
  AuthenticatedUser,
  FirebaseTokenPayload,
  UserStatsResponse,
  UserSearchResponse,
  Follow,
  Block
} from '../types/index.js';
import {
  ResourceConflictError,
  SelfFollowError,
  AlreadyFollowingError,
  NotFollowingError,
  BlockedByUserError,
} from '../errors/index.js';

export class UserService extends BaseService {
  constructor(repositories: RepositoryContainer) {
    super(repositories);
  }

  /**
   * Creates or finds a user based on Firebase authentication
   */
  async findOrCreateUser(firebaseToken: FirebaseTokenPayload): Promise<AuthenticatedUser> {
    this.validateRequired(firebaseToken.uid, 'Firebase UID');
    this.validateRequired(firebaseToken.email, 'Email');
    this.validateEmail(firebaseToken.email);

    // Try to find existing user
    const existingUser = await this.repositories.userRepository.findByFirebaseUid(firebaseToken.uid);
    if (existingUser) {
      return existingUser;
    }

    // Create new user
    const userData: UserInsert = {
      firebaseUid: firebaseToken.uid,
      username: (firebaseToken.name ?? firebaseToken.email.split('@')[0]) as string,
      email: firebaseToken.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.validateLength(userData.username, 1, 50, 'username');
    
    return await this.repositories.userRepository.createUser(userData);
  }

  /**
   * Gets user by ID
   */
  async getUserById(id: number): Promise<User> {
    this.validatePositive(id, 'User ID');
    
    const user = await this.repositories.userRepository.findById(id);
    this.validateResourceExists(user, 'User', id);
    
    return user;
  }

  /**
   * Updates user information
   */
  async updateUser(id: number, updates: UserUpdate, currentUserId: number): Promise<User> {
    this.validatePositive(id, 'User ID');
    this.validateOwnership(id, currentUserId, 'User', id);

    // Validate update data
    if (updates.username) {
      this.validateNotEmpty(updates.username, 'username');
      this.validateLength(updates.username, 1, 50, 'username');
    }

    if (updates.email) {
      this.validateEmail(updates.email);
    }

    return await this.repositories.userRepository.updateUser(id, updates);
  }

  /**
   * Searches for users
   */
  async searchUsers(
    query: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<UserSearchResponse> {
    this.validateNotEmpty(query, 'search query');
    this.validateLength(query, 1, 100, 'search query');

    const { validatedLimit, offset } = this.validatePagination(options.page, options.limit);

    const result = await this.repositories.userRepository.searchUsers(query, {
      limit: validatedLimit,
      offset,
    });

    return {
      users: result.users,
      total: result.total,
    };
  }

  /**
   * Gets user statistics
   */
  async getUserStats(userId: number): Promise<UserStatsResponse> {
    this.validatePositive(userId, 'User ID');

    // Verify user exists
    await this.getUserById(userId);

    // Get stats from repository
    return await this.repositories.userRepository.getUserStats(userId);
  }

  /**
   * Follows another user
   */
  async followUser(followerId: number, followingId: number): Promise<Follow> {
    this.validatePositive(followerId, 'Follower ID');
    this.validatePositive(followingId, 'Following ID');

    // Prevent self-following
    if (followerId === followingId) {
      throw new SelfFollowError();
    }

    // Check if users exist
    await this.getUserById(followerId);
    await this.getUserById(followingId);

    // Check if already following
    const isAlreadyFollowing = await this.repositories.userRepository.isFollowing(
      followerId,
      followingId
    );
    if (isAlreadyFollowing) {
      throw new AlreadyFollowingError('user');
    }

    // Check if blocked
    const isBlocked = await this.repositories.userRepository.isBlocked(followingId, followerId);
    if (isBlocked) {
      throw new BlockedByUserError('user');
    }

    return await this.repositories.userRepository.followUser(followerId, followingId);
  }

  /**
   * Unfollows a user
   */
  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    this.validatePositive(followerId, 'Follower ID');
    this.validatePositive(followingId, 'Following ID');

    // Prevent self-unfollowing
    if (followerId === followingId) {
      throw new SelfFollowError();
    }

    // Check if actually following
    const isFollowing = await this.repositories.userRepository.isFollowing(
      followerId,
      followingId
    );
    if (!isFollowing) {
      throw new NotFollowingError('user');
    }

    return await this.repositories.userRepository.unfollowUser(followerId, followingId);
  }

  /**
   * Blocks another user
   */
  async blockUser(blockerId: number, blockedId: number): Promise<Block> {
    this.validatePositive(blockerId, 'Blocker ID');
    this.validatePositive(blockedId, 'Blocked ID');

    // Prevent self-blocking
    if (blockerId === blockedId) {
      throw this.createBusinessError('Cannot block yourself');
    }

    // Check if users exist
    await this.getUserById(blockerId);
    await this.getUserById(blockedId);

    // Check if already blocked
    const isAlreadyBlocked = await this.repositories.userRepository.isBlocked(
      blockerId,
      blockedId
    );
    if (isAlreadyBlocked) {
      throw new ResourceConflictError('Block', 'User is already blocked');
    }

    // If they were following each other, remove the follow relationships
    const isFollowing = await this.repositories.userRepository.isFollowing(blockerId, blockedId);
    if (isFollowing) {
      await this.repositories.userRepository.unfollowUser(blockerId, blockedId);
    }

    const isFollowedBy = await this.repositories.userRepository.isFollowing(blockedId, blockerId);
    if (isFollowedBy) {
      await this.repositories.userRepository.unfollowUser(blockedId, blockerId);
    }

    return await this.repositories.userRepository.blockUser(blockerId, blockedId);
  }

  /**
   * Unblocks a user
   */
  async unblockUser(blockerId: number, blockedId: number): Promise<void> {
    this.validatePositive(blockerId, 'Blocker ID');
    this.validatePositive(blockedId, 'Blocked ID');

    // Prevent self-unblocking
    if (blockerId === blockedId) {
      throw this.createBusinessError('Cannot unblock yourself');
    }

    // Check if actually blocked
    const isBlocked = await this.repositories.userRepository.isBlocked(blockerId, blockedId);
    if (!isBlocked) {
      throw this.createBusinessError('User is not blocked');
    }

    return await this.repositories.userRepository.unblockUser(blockerId, blockedId);
  }

  /**
   * Checks if one user is following another
   */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    this.validatePositive(followerId, 'Follower ID');
    this.validatePositive(followingId, 'Following ID');

    return await this.repositories.userRepository.isFollowing(followerId, followingId);
  }

  /**
   * Checks if one user has blocked another
   */
  async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    this.validatePositive(blockerId, 'Blocker ID');
    this.validatePositive(blockedId, 'Blocked ID');

    return await this.repositories.userRepository.isBlocked(blockerId, blockedId);
  }

  /**
   * Deletes a user account
   */
  async deleteUser(id: number, currentUserId: number): Promise<void> {
    this.validatePositive(id, 'User ID');
    this.validateOwnership(id, currentUserId, 'User', id);

    // Verify user exists
    await this.getUserById(id);

    return await this.repositories.userRepository.deleteUser(id);
  }
}