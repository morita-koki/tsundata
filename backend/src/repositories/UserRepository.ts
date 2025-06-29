/**
 * User Repository
 * Handles all user-related database operations
 */

import { eq, and, asc, like, count } from 'drizzle-orm';
import { users, follows, blocks } from '../models/index.js';
import { BaseRepository, type Database } from './BaseRepository.js';
import type { 
  User, 
  UserInsert, 
  UserUpdate, 
  Follow, 
  Block,
  AuthenticatedUser 
} from '../types/index.js';
import { 
  ResourceConflictError 
} from '../errors/index.js';

export class UserRepository extends BaseRepository {
  constructor(db: Database) {
    super(db);
  }

  /**
   * Creates a new user
   */
  async createUser(userData: UserInsert): Promise<AuthenticatedUser> {
    return this.executeOperation(async () => {
      const result = await this.db
        .insert(users)
        .values(userData)
        .returning({
          id: users.id,
          firebaseUid: users.firebaseUid,
          username: users.username,
          email: users.email,
        });

      this.validateRecordsExist(result, 'User');
      return result[0] as AuthenticatedUser;
    }, 'create user');
  }

  /**
   * Finds user by ID
   */
  async findById(id: number): Promise<User | null> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return result[0] || null;
    }, 'find user by ID');
  }

  /**
   * Finds user by Firebase UID
   */
  async findByFirebaseUid(firebaseUid: string): Promise<AuthenticatedUser | null> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select({
          id: users.id,
          firebaseUid: users.firebaseUid,
          username: users.username,
          email: users.email,
        })
        .from(users)
        .where(eq(users.firebaseUid, firebaseUid))
        .limit(1);

      return result[0] || null;
    }, 'find user by Firebase UID');
  }

  /**
   * Finds user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return result[0] || null;
    }, 'find user by email');
  }

  /**
   * Updates user information
   */
  async updateUser(id: number, updates: UserUpdate): Promise<User> {
    return this.executeOperation(async () => {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      const result = await this.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      this.validateRecordsExist(result, 'User');
      return result[0] as User;
    }, 'update user');
  }

  /**
   * Searches users by username or email
   */
  async searchUsers(
    query: string, 
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ users: Array<Pick<User, 'id' | 'username' | 'email'>>; total: number }> {
    return this.executeOperation(async () => {
      const { limit = 20, offset = 0 } = options;
      const searchPattern = `%${query}%`;

      // Get matching users
      const userResults = await this.db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
        })
        .from(users)
        .where(
          and(
            like(users.username, searchPattern),
            like(users.email, searchPattern)
          )
        )
        .limit(limit)
        .offset(offset)
        .orderBy(asc(users.username));

      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            like(users.username, searchPattern),
            like(users.email, searchPattern)
          )
        );

      return {
        users: userResults,
        total: totalResult[0]?.count || 0,
      };
    }, 'search users');
  }

  /**
   * Deletes a user (soft delete by updating a status field could be added)
   */
  async deleteUser(id: number): Promise<void> {
    return this.executeOperation(async () => {
      const result = await this.db
        .delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id });

      this.validateRecordsExist(result, 'User');
    }, 'delete user');
  }

  /**
   * Creates a follow relationship
   */
  async followUser(followerId: number, followingId: number): Promise<Follow> {
    return this.executeOperation(async () => {
      // Check if already following
      const existing = await this.db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ResourceConflictError('Follow', 'Already following this user');
      }

      const result = await this.db
        .insert(follows)
        .values({
          followerId,
          followingId,
          createdAt: new Date(),
        })
        .returning();

      this.validateRecordsExist(result, 'Follow');
      return result[0] as Follow;
    }, 'follow user');
  }

  /**
   * Removes a follow relationship
   */
  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    return this.executeOperation(async () => {
      const result = await this.db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId)
          )
        )
        .returning({ id: follows.id });

      this.validateRecordsExist(result, 'Follow');
    }, 'unfollow user');
  }

  /**
   * Creates a block relationship
   */
  async blockUser(blockerId: number, blockedId: number): Promise<Block> {
    return this.executeOperation(async () => {
      // Check if already blocked
      const existing = await this.db
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.blockerId, blockerId),
            eq(blocks.blockedId, blockedId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ResourceConflictError('Block', 'User is already blocked');
      }

      const result = await this.db
        .insert(blocks)
        .values({
          blockerId,
          blockedId,
          createdAt: new Date(),
        })
        .returning();

      this.validateRecordsExist(result, 'Block');
      return result[0] as Block;
    }, 'block user');
  }

  /**
   * Removes a block relationship
   */
  async unblockUser(blockerId: number, blockedId: number): Promise<void> {
    return this.executeOperation(async () => {
      const result = await this.db
        .delete(blocks)
        .where(
          and(
            eq(blocks.blockerId, blockerId),
            eq(blocks.blockedId, blockedId)
          )
        )
        .returning({ id: blocks.id });

      this.validateRecordsExist(result, 'Block');
    }, 'unblock user');
  }

  /**
   * Gets user statistics
   */
  async getUserStats(_userId: number): Promise<{
    totalBooks: number;
    readBooks: number;
    unreadBooks: number;
    totalBookshelves: number;
    publicBookshelves: number;
    followers: number;
    following: number;
  }> {
    return this.executeOperation(async () => {
      // This would need to be implemented with joins to other tables
      // For now, returning placeholder structure
      return {
        totalBooks: 0,
        readBooks: 0,
        unreadBooks: 0,
        totalBookshelves: 0,
        publicBookshelves: 0,
        followers: 0,
        following: 0,
      };
    }, 'get user stats');
  }

  /**
   * Checks if user1 is following user2
   */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select({ id: follows.id })
        .from(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId)
          )
        )
        .limit(1);

      return result.length > 0;
    }, 'check following status');
  }

  /**
   * Checks if user1 has blocked user2
   */
  async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select({ id: blocks.id })
        .from(blocks)
        .where(
          and(
            eq(blocks.blockerId, blockerId),
            eq(blocks.blockedId, blockedId)
          )
        )
        .limit(1);

      return result.length > 0;
    }, 'check blocked status');
  }
}