/**
 * UserRepository Unit Tests
 * Tests all user-related database operations
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UserRepository } from '../../../repositories/UserRepository.js';
import { createTestDatabase, closeTestDatabase } from '../../utils/dbHelpers.js';
import { TEST_USERS } from '../../fixtures/testData.js';
import type { Database } from '../../../repositories/BaseRepository.js';
import type { UserInsert, UserUpdate } from '../../../types/index.js';
import { ValidationError, DatabaseError } from '../../../errors/index.js';

describe('UserRepository', () => {
  let db: Database;
  let userRepository: UserRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    userRepository = new UserRepository(db);
  });

  afterEach(async () => {
    await closeTestDatabase(db);
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData: UserInsert = {
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      };

      const user = await userRepository.createUser(userData);

      expect(user).toMatchObject({
        id: expect.any(Number),
        firebaseUid: userData.firebaseUid,
        email: userData.email,
        username: userData.username,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should throw error for duplicate firebaseUid', async () => {
      const userData: UserInsert = {
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      };

      await userRepository.createUser(userData);

      await expect(userRepository.createUser(userData))
        .rejects.toThrow();
    });

    it('should throw error for duplicate email', async () => {
      const userData1: UserInsert = {
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      };

      const userData2: UserInsert = {
        firebaseUid: 'different-uid',
        email: TEST_USERS.USER1.email, // Same email
        username: 'different-username',
      };

      await userRepository.createUser(userData1);

      await expect(userRepository.createUser(userData2))
        .rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should retrieve user by ID', async () => {
      const userData: UserInsert = {
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      };

      const createdUser = await userRepository.createUser(userData);
      const retrievedUser = await userRepository.findById(createdUser.id);

      expect(retrievedUser).toEqual(createdUser);
    });

    it('should return null for non-existent user ID', async () => {
      const result = await userRepository.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('findByFirebaseUid', () => {
    it('should retrieve user by Firebase UID', async () => {
      const userData: UserInsert = {
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      };

      const createdUser = await userRepository.createUser(userData);
      const retrievedUser = await userRepository.findByFirebaseUid(userData.firebaseUid);

      expect(retrievedUser).toMatchObject({
        id: createdUser.id,
        firebaseUid: createdUser.firebaseUid,
        email: createdUser.email,
        username: createdUser.username,
      });
    });

    it('should return null for non-existent Firebase UID', async () => {
      const result = await userRepository.findByFirebaseUid('non-existent-uid');
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should retrieve user by email', async () => {
      const userData: UserInsert = {
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      };

      const createdUser = await userRepository.createUser(userData);
      const retrievedUser = await userRepository.findByEmail(userData.email);

      expect(retrievedUser).toEqual(createdUser);
    });

    it('should return null for non-existent email', async () => {
      const retrievedUser = await userRepository.findByEmail('non-existent@example.com');
      expect(retrievedUser).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userData: UserInsert = {
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      };

      const createdUser = await userRepository.createUser(userData);
      
      const updateData: UserUpdate = {
        username: 'updated-username',
        email: 'updated@example.com',
      };

      const updatedUser = await userRepository.updateUser(createdUser.id, updateData);

      expect(updatedUser).toMatchObject({
        id: createdUser.id,
        firebaseUid: createdUser.firebaseUid,
        username: updateData.username,
        email: updateData.email,
        updatedAt: expect.any(Date),
      });

      // Verify updatedAt changed
      expect(new Date(updatedUser.updatedAt).getTime())
        .toBeGreaterThan(new Date(createdUser.updatedAt).getTime());
    });

    it('should throw error when updating non-existent user', async () => {
      const updateData: UserUpdate = {
        username: 'new-username',
      };

      await expect(userRepository.updateUser(999, updateData))
        .rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userData: UserInsert = {
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      };

      const createdUser = await userRepository.createUser(userData);
      
      await userRepository.deleteUser(createdUser.id);

      await expect(userRepository.findById(createdUser.id))
        .rejects.toThrow();
    });

    it('should throw error when deleting non-existent user', async () => {
      await expect(userRepository.deleteUser(999))
        .rejects.toThrow();
    });
  });

  describe('searchUsers', () => {
    beforeEach(async () => {
      // Create test users
      await userRepository.createUser({
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      });

      await userRepository.createUser({
        firebaseUid: TEST_USERS.USER2.firebaseUid,
        email: TEST_USERS.USER2.email,
        username: TEST_USERS.USER2.username,
      });
    });

    it('should search users by username', async () => {
      const result = await userRepository.searchUsers('alice', { page: 1, limit: 10 });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].username).toBe(TEST_USERS.USER1.username);
      expect(result.total).toBe(1);
    });

    it('should search users by email', async () => {
      const result = await userRepository.searchUsers('bob@example.com', { page: 1, limit: 10 });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].email).toBe(TEST_USERS.USER2.email);
      expect(result.total).toBe(1);
    });

    it('should return empty result for no matches', async () => {
      const result = await userRepository.searchUsers('nonexistent', { page: 1, limit: 10 });

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const result = await userRepository.searchUsers('user', { page: 1, limit: 1 });

      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(2);
    });
  });

  describe('getUserStats', () => {
    it('should return zero stats for user with no books', async () => {
      const userData: UserInsert = {
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      };

      const user = await userRepository.createUser(userData);
      const stats = await userRepository.getUserStats(user.id);

      expect(stats).toEqual({
        totalBooks: 0,
        readBooks: 0,
        unreadBooks: 0,
        totalValue: 0,
        unreadValue: 0,
      });
    });
  });

  describe('followUser', () => {
    let user1: any, user2: any;

    beforeEach(async () => {
      user1 = await userRepository.createUser({
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      });

      user2 = await userRepository.createUser({
        firebaseUid: TEST_USERS.USER2.firebaseUid,
        email: TEST_USERS.USER2.email,
        username: TEST_USERS.USER2.username,
      });
    });

    it('should create follow relationship', async () => {
      const follow = await userRepository.followUser(user1.id, user2.id);

      expect(follow).toMatchObject({
        id: expect.any(Number),
        followerId: user1.id,
        followingId: user2.id,
        createdAt: expect.any(String),
      });
    });

    it('should throw error for duplicate follow', async () => {
      await userRepository.followUser(user1.id, user2.id);

      await expect(userRepository.followUser(user1.id, user2.id))
        .rejects.toThrow();
    });

    it('should throw error for self-follow', async () => {
      await expect(userRepository.followUser(user1.id, user1.id))
        .rejects.toThrow();
    });
  });

  describe('unfollowUser', () => {
    let user1: any, user2: any;

    beforeEach(async () => {
      user1 = await userRepository.createUser({
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      });

      user2 = await userRepository.createUser({
        firebaseUid: TEST_USERS.USER2.firebaseUid,
        email: TEST_USERS.USER2.email,
        username: TEST_USERS.USER2.username,
      });

      await userRepository.followUser(user1.id, user2.id);
    });

    it('should remove follow relationship', async () => {
      await userRepository.unfollowUser(user1.id, user2.id);

      const isFollowing = await userRepository.isFollowing(user1.id, user2.id);
      expect(isFollowing).toBe(false);
    });

    it('should throw error for non-existent follow', async () => {
      await userRepository.unfollowUser(user1.id, user2.id);

      await expect(userRepository.unfollowUser(user1.id, user2.id))
        .rejects.toThrow();
    });
  });

  describe('isFollowing', () => {
    let user1: any, user2: any;

    beforeEach(async () => {
      user1 = await userRepository.createUser({
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      });

      user2 = await userRepository.createUser({
        firebaseUid: TEST_USERS.USER2.firebaseUid,
        email: TEST_USERS.USER2.email,
        username: TEST_USERS.USER2.username,
      });
    });

    it('should return true when following', async () => {
      await userRepository.followUser(user1.id, user2.id);

      const isFollowing = await userRepository.isFollowing(user1.id, user2.id);
      expect(isFollowing).toBe(true);
    });

    it('should return false when not following', async () => {
      const isFollowing = await userRepository.isFollowing(user1.id, user2.id);
      expect(isFollowing).toBe(false);
    });
  });

  describe('blockUser and isBlocked', () => {
    let user1: any, user2: any;

    beforeEach(async () => {
      user1 = await userRepository.createUser({
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      });

      user2 = await userRepository.createUser({
        firebaseUid: TEST_USERS.USER2.firebaseUid,
        email: TEST_USERS.USER2.email,
        username: TEST_USERS.USER2.username,
      });
    });

    it('should create block relationship', async () => {
      const block = await userRepository.blockUser(user1.id, user2.id);

      expect(block).toMatchObject({
        id: expect.any(Number),
        blockerId: user1.id,
        blockedId: user2.id,
        createdAt: expect.any(String),
      });

      const isBlocked = await userRepository.isBlocked(user1.id, user2.id);
      expect(isBlocked).toBe(true);
    });

    it('should throw error for duplicate block', async () => {
      await userRepository.blockUser(user1.id, user2.id);

      await expect(userRepository.blockUser(user1.id, user2.id))
        .rejects.toThrow();
    });

    it('should unblock user successfully', async () => {
      await userRepository.blockUser(user1.id, user2.id);
      await userRepository.unblockUser(user1.id, user2.id);

      const isBlocked = await userRepository.isBlocked(user1.id, user2.id);
      expect(isBlocked).toBe(false);
    });
  });
});