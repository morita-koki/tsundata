/**
 * UserService Unit Tests
 * Tests all user-related business logic
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UserService } from '../../../services/UserService.js';
import { TEST_USERS } from '../../fixtures/testData.js';
import type { RepositoryContainer } from '../../../repositories/index.js';
import type { FirebaseTokenPayload, UserInsert, UserUpdate } from '../../../types/index.js';
import {
  SelfFollowError,
  AlreadyFollowingError,
  NotFollowingError,
  BlockedByUserError,
  ResourceConflictError,
  ValidationError,
  BusinessLogicError,
} from '../../../errors/index.js';

// Create mock repository
const createMockRepository = () => ({
  findByFirebaseUid: jest.fn(),
  createUser: jest.fn(),
  findById: jest.fn(),
  updateUser: jest.fn(),
  searchUsers: jest.fn(),
  getUserStats: jest.fn(),
  isFollowing: jest.fn(),
  isBlocked: jest.fn(),
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
  blockUser: jest.fn(),
  unblockUser: jest.fn(),
  deleteUser: jest.fn(),
});

describe('UserService', () => {
  let repositories: RepositoryContainer;
  let userService: UserService;
  let mockUserRepository: ReturnType<typeof createMockRepository>;
  let testUser1: any;
  let testUser2: any;

  beforeEach(() => {
    mockUserRepository = createMockRepository();
    repositories = {
      userRepository: mockUserRepository,
      bookRepository: {} as any,
      bookshelfRepository: {} as any,
    };
    userService = new UserService(repositories);

    // Define test users
    testUser1 = {
      id: 1,
      firebaseUid: TEST_USERS.USER1.firebaseUid,
      email: TEST_USERS.USER1.email,
      username: TEST_USERS.USER1.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    testUser2 = {
      id: 2,
      firebaseUid: TEST_USERS.USER2.firebaseUid,
      email: TEST_USERS.USER2.email,
      username: TEST_USERS.USER2.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreateUser', () => {
    it('should return existing user if found', async () => {
      const firebaseToken: FirebaseTokenPayload = {
        uid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        name: 'Test User',
      };

      mockUserRepository.findByFirebaseUid.mockResolvedValue(testUser1);

      const user = await userService.findOrCreateUser(firebaseToken);

      expect(mockUserRepository.findByFirebaseUid).toHaveBeenCalledWith(TEST_USERS.USER1.firebaseUid);
      expect(user).toMatchObject({
        id: testUser1.id,
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      });
    });

    it('should create new user if not found', async () => {
      const firebaseToken: FirebaseTokenPayload = {
        uid: 'new-firebase-uid',
        email: 'newuser@example.com',
        name: 'New User',
      };

      const newUser = {
        id: 3,
        firebaseUid: 'new-firebase-uid',
        email: 'newuser@example.com',
        username: 'New User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByFirebaseUid.mockResolvedValue(null);
      mockUserRepository.createUser.mockResolvedValue(newUser);

      const user = await userService.findOrCreateUser(firebaseToken);

      expect(mockUserRepository.findByFirebaseUid).toHaveBeenCalledWith('new-firebase-uid');
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(expect.objectContaining({
        firebaseUid: 'new-firebase-uid',
        email: 'newuser@example.com',
        username: 'New User',
      }));
      expect(user).toMatchObject({
        id: 3,
        firebaseUid: 'new-firebase-uid',
        email: 'newuser@example.com',
        username: 'New User',
      });
    });

    it('should create username from email if name not provided', async () => {
      const firebaseToken: FirebaseTokenPayload = {
        uid: 'another-firebase-uid',
        email: 'testuser@example.com',
      };

      const newUser = {
        id: 4,
        firebaseUid: 'another-firebase-uid',
        email: 'testuser@example.com',
        username: 'testuser',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByFirebaseUid.mockResolvedValue(null);
      mockUserRepository.createUser.mockResolvedValue(newUser);

      const user = await userService.findOrCreateUser(firebaseToken);

      expect(mockUserRepository.createUser).toHaveBeenCalledWith(expect.objectContaining({
        username: 'testuser',
      }));
      expect(user.username).toBe('testuser');
    });

    it('should validate required fields', async () => {
      const firebaseToken: FirebaseTokenPayload = {
        uid: undefined as any,
        email: 'test@example.com',
      };

      await expect(userService.findOrCreateUser(firebaseToken))
        .rejects.toThrow(ValidationError);
    });

    it('should validate email format', async () => {
      const firebaseToken: FirebaseTokenPayload = {
        uid: 'test-uid',
        email: 'invalid-email',
      };

      await expect(userService.findOrCreateUser(firebaseToken))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      mockUserRepository.findById.mockResolvedValue(testUser1);

      const user = await userService.getUserById(testUser1.id);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(testUser1.id);
      expect(user).toMatchObject({
        id: testUser1.id,
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      });
    });

    it('should throw error for non-existent user', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById(999))
        .rejects.toThrow(BusinessLogicError);
    });

    it('should validate positive ID', async () => {
      await expect(userService.getUserById(-1))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updates: UserUpdate = {
        username: 'updated_username',
        email: 'updated@example.com',
      };

      const updatedUser = {
        ...testUser1,
        username: 'updated_username',
        email: 'updated@example.com',
      };

      mockUserRepository.updateUser.mockResolvedValue(updatedUser);

      const result = await userService.updateUser(
        testUser1.id,
        updates,
        testUser1.id
      );

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(testUser1.id, updates);
      expect(result).toMatchObject({
        id: testUser1.id,
        username: 'updated_username',
        email: 'updated@example.com',
      });
    });

    it('should throw error for unauthorized update', async () => {
      const updates: UserUpdate = {
        username: 'updated_username',
      };

      await expect(userService.updateUser(testUser1.id, updates, testUser2.id))
        .rejects.toThrow(BusinessLogicError);
    });

    it('should validate username length', async () => {
      const updates: UserUpdate = {
        username: 'a'.repeat(51), // Too long username
      };

      await expect(userService.updateUser(testUser1.id, updates, testUser1.id))
        .rejects.toThrow(ValidationError);
    });

    it('should validate email format', async () => {
      const updates: UserUpdate = {
        email: 'invalid-email',
      };

      await expect(userService.updateUser(testUser1.id, updates, testUser1.id))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('searchUsers', () => {
    it('should search users by username', async () => {
      const searchResult = {
        users: [testUser1],
        total: 1,
      };

      mockUserRepository.searchUsers.mockResolvedValue(searchResult);

      const result = await userService.searchUsers('alice');

      expect(mockUserRepository.searchUsers).toHaveBeenCalledWith('alice', {
        limit: 20,
        offset: 0,
      });
      expect(result.users).toHaveLength(1);
      expect(result.users[0].username).toContain('alice');
      expect(result.total).toBe(1);
    });

    it('should search users by email', async () => {
      const searchResult = {
        users: [testUser1],
        total: 1,
      };

      mockUserRepository.searchUsers.mockResolvedValue(searchResult);

      const result = await userService.searchUsers('alice@example.com');

      expect(result.users).toHaveLength(1);
      expect(result.users[0].email).toBe('alice@example.com');
      expect(result.total).toBe(1);
    });

    it('should handle pagination', async () => {
      const searchResult = {
        users: [testUser1],
        total: 2,
      };

      mockUserRepository.searchUsers.mockResolvedValue(searchResult);

      const result = await userService.searchUsers('user', { page: 1, limit: 1 });

      expect(mockUserRepository.searchUsers).toHaveBeenCalledWith('user', {
        limit: 1,
        offset: 0,
      });
      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it('should validate search query', async () => {
      await expect(userService.searchUsers(''))
        .rejects.toThrow(ValidationError);
    });

    it('should validate query length', async () => {
      const longQuery = 'a'.repeat(101);
      await expect(userService.searchUsers(longQuery))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        booksRead: 5,
        booksTotal: 10,
        bookshelvesTotal: 3,
        followersCount: 2,
        followingCount: 4,
      };

      mockUserRepository.findById.mockResolvedValue(testUser1);
      mockUserRepository.getUserStats.mockResolvedValue(mockStats);

      const stats = await userService.getUserStats(testUser1.id);

      expect(mockUserRepository.getUserStats).toHaveBeenCalledWith(testUser1.id);
      expect(stats).toMatchObject({
        booksRead: 5,
        booksTotal: 10,
        bookshelvesTotal: 3,
        followersCount: 2,
        followingCount: 4,
      });
    });

    it('should throw error for non-existent user', async () => {
      await expect(userService.getUserStats(999))
        .rejects.toThrow(BusinessLogicError);
    });
  });

  describe('followUser', () => {
    it('should follow user successfully', async () => {
      const mockFollow = {
        id: 1,
        followerId: testUser1.id,
        followingId: testUser2.id,
        createdAt: new Date(),
      };

      mockUserRepository.findById.mockImplementation((id) => {
        if (id === testUser1.id) return Promise.resolve(testUser1);
        if (id === testUser2.id) return Promise.resolve(testUser2);
        return Promise.resolve(null);
      });
      mockUserRepository.isFollowing.mockResolvedValue(false);
      mockUserRepository.isBlocked.mockResolvedValue(false);
      mockUserRepository.followUser.mockResolvedValue(mockFollow);

      const follow = await userService.followUser(testUser1.id, testUser2.id);

      expect(mockUserRepository.followUser).toHaveBeenCalledWith(testUser1.id, testUser2.id);
      expect(follow).toMatchObject({
        id: 1,
        followerId: testUser1.id,
        followingId: testUser2.id,
        createdAt: expect.any(Date),
      });
    });

    it('should throw error for self-following', async () => {
      await expect(userService.followUser(testUser1.id, testUser1.id))
        .rejects.toThrow(SelfFollowError);
    });

    it('should throw error if already following', async () => {
      mockUserRepository.findById.mockImplementation((id) => {
        if (id === testUser1.id) return Promise.resolve(testUser1);
        if (id === testUser2.id) return Promise.resolve(testUser2);
        return Promise.resolve(null);
      });
      mockUserRepository.isFollowing.mockResolvedValue(true);

      await expect(userService.followUser(testUser1.id, testUser2.id))
        .rejects.toThrow(AlreadyFollowingError);
    });

    it('should throw error if blocked by user', async () => {
      mockUserRepository.findById.mockImplementation((id) => {
        if (id === testUser1.id) return Promise.resolve(testUser1);
        if (id === testUser2.id) return Promise.resolve(testUser2);
        return Promise.resolve(null);
      });
      mockUserRepository.isFollowing.mockResolvedValue(false);
      mockUserRepository.isBlocked.mockResolvedValue(true);

      await expect(userService.followUser(testUser1.id, testUser2.id))
        .rejects.toThrow(BlockedByUserError);
    });

    it('should throw error for non-existent users', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.followUser(999, testUser2.id))
        .rejects.toThrow(BusinessLogicError);
    });
  });

  describe('unfollowUser', () => {
    it('should unfollow user successfully', async () => {
      mockUserRepository.isFollowing.mockResolvedValue(true);
      mockUserRepository.unfollowUser.mockResolvedValue(undefined);

      await expect(userService.unfollowUser(testUser1.id, testUser2.id))
        .resolves.not.toThrow();

      expect(mockUserRepository.unfollowUser).toHaveBeenCalledWith(testUser1.id, testUser2.id);
    });

    it('should throw error for self-unfollowing', async () => {
      await expect(userService.unfollowUser(testUser1.id, testUser1.id))
        .rejects.toThrow(SelfFollowError);
    });

    it('should throw error if not following', async () => {
      mockUserRepository.isFollowing.mockResolvedValue(false);

      await expect(userService.unfollowUser(testUser1.id, testUser2.id))
        .rejects.toThrow(NotFollowingError);
    });
  });

  describe('blockUser', () => {
    it('should block user successfully', async () => {
      const mockBlock = {
        id: 1,
        blockerId: testUser1.id,
        blockedId: testUser2.id,
        createdAt: new Date(),
      };

      mockUserRepository.findById.mockImplementation((id) => {
        if (id === testUser1.id) return Promise.resolve(testUser1);
        if (id === testUser2.id) return Promise.resolve(testUser2);
        return Promise.resolve(null);
      });
      mockUserRepository.isBlocked.mockResolvedValue(false);
      mockUserRepository.isFollowing.mockResolvedValue(false);
      mockUserRepository.blockUser.mockResolvedValue(mockBlock);

      const block = await userService.blockUser(testUser1.id, testUser2.id);

      expect(mockUserRepository.blockUser).toHaveBeenCalledWith(testUser1.id, testUser2.id);
      expect(block).toMatchObject({
        id: 1,
        blockerId: testUser1.id,
        blockedId: testUser2.id,
        createdAt: expect.any(Date),
      });
    });

    it('should throw error for self-blocking', async () => {
      await expect(userService.blockUser(testUser1.id, testUser1.id))
        .rejects.toThrow();
    });
  });

  describe('unblockUser', () => {
    it('should unblock user successfully', async () => {
      mockUserRepository.isBlocked.mockResolvedValue(true);
      mockUserRepository.unblockUser.mockResolvedValue(undefined);

      await expect(userService.unblockUser(testUser1.id, testUser2.id))
        .resolves.not.toThrow();

      expect(mockUserRepository.unblockUser).toHaveBeenCalledWith(testUser1.id, testUser2.id);
    });

    it('should throw error for self-unblocking', async () => {
      await expect(userService.unblockUser(testUser1.id, testUser1.id))
        .rejects.toThrow();
    });

    it('should throw error if not blocked', async () => {
      mockUserRepository.isBlocked.mockResolvedValue(false);

      await expect(userService.unblockUser(testUser1.id, testUser2.id))
        .rejects.toThrow();
    });
  });

  describe('isFollowing', () => {
    it('should return repository result', async () => {
      mockUserRepository.isFollowing.mockResolvedValue(true);

      const isFollowing = await userService.isFollowing(testUser1.id, testUser2.id);
      
      expect(mockUserRepository.isFollowing).toHaveBeenCalledWith(testUser1.id, testUser2.id);
      expect(isFollowing).toBe(true);
    });
  });

  describe('isBlocked', () => {
    it('should return repository result', async () => {
      mockUserRepository.isBlocked.mockResolvedValue(false);

      const isBlocked = await userService.isBlocked(testUser1.id, testUser2.id);
      
      expect(mockUserRepository.isBlocked).toHaveBeenCalledWith(testUser1.id, testUser2.id);
      expect(isBlocked).toBe(false);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUserRepository.findById.mockResolvedValue(testUser1);
      mockUserRepository.deleteUser.mockResolvedValue(undefined);

      await expect(userService.deleteUser(testUser1.id, testUser1.id))
        .resolves.not.toThrow();

      expect(mockUserRepository.deleteUser).toHaveBeenCalledWith(testUser1.id);
    });

    it('should throw error for unauthorized deletion', async () => {
      await expect(userService.deleteUser(testUser1.id, testUser2.id))
        .rejects.toThrow(BusinessLogicError);
    });
  });
});