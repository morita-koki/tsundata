/**
 * API Integration Tests
 * Tests API endpoints with mocked dependencies
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { TEST_USERS, TEST_BOOKS } from '../fixtures/testData.js';

// Mock external dependencies
jest.mock('../../config/firebase.js', () => ({
  admin: {
    auth: () => ({
      verifyIdToken: jest.fn(),
    }),
  },
}));

jest.mock('../../config/database.js', () => ({
  db: {},
}));

jest.mock('../../services/index.js', () => ({
  userService: {
    findOrCreateUser: jest.fn(),
    getUserById: jest.fn(),
    searchUsers: jest.fn(),
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
  },
  bookService: {
    searchBookByISBN: jest.fn(),
    addBookToLibrary: jest.fn(),
    removeBookFromLibrary: jest.fn(),
    updateReadingStatus: jest.fn(),
    getUserLibrary: jest.fn(),
    searchBooks: jest.fn(),
  },
  bookshelfService: {
    createBookshelf: jest.fn(),
    getUserBookshelves: jest.fn(),
    getBookshelfWithBooks: jest.fn(),
    updateBookshelf: jest.fn(),
    deleteBookshelf: jest.fn(),
  },
}));

describe('API Integration Tests', () => {
  let app: express.Application;
  let mockUserService: any;
  let mockBookService: any;
  let mockBookshelfService: any;

  beforeEach(async () => {
    // Import app after mocking dependencies
    const { default: createApp } = await import('../../index.js');
    app = createApp();

    // Get mocked services
    const services = await import('../../services/index.js');
    mockUserService = services.userService;
    mockBookService = services.bookService;
    mockBookshelfService = services.bookshelfService;

    // Setup common mock responses
    const mockFirebaseAuth = await import('../../config/firebase.js');
    (mockFirebaseAuth.admin.auth().verifyIdToken as jest.Mock).mockResolvedValue({
      uid: TEST_USERS.USER1.firebaseUid,
      email: TEST_USERS.USER1.email,
    });

    mockUserService.findOrCreateUser.mockResolvedValue({
      id: 1,
      firebaseUid: TEST_USERS.USER1.firebaseUid,
      email: TEST_USERS.USER1.email,
      username: TEST_USERS.USER1.username,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Endpoints', () => {
    it('POST /api/auth/login should authenticate user', async () => {
      const mockUser = {
        id: 1,
        firebaseUid: TEST_USERS.USER1.firebaseUid,
        email: TEST_USERS.USER1.email,
        username: TEST_USERS.USER1.username,
      };

      mockUserService.findOrCreateUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toMatchObject({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        }),
      });
    });

    it('POST /api/auth/login should return 401 for invalid token', async () => {
      const mockFirebaseAuth = await import('../../config/firebase.js');
      (mockFirebaseAuth.admin.auth().verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('Invalid token')
      );

      const response = await request(app)
        .post('/api/auth/login')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Book Endpoints', () => {
    const authHeaders = { Authorization: 'Bearer test-token' };

    it('GET /api/books/search should search books by ISBN', async () => {
      const mockBook = {
        id: 1,
        isbn: TEST_BOOKS.BOOK1.isbn,
        title: TEST_BOOKS.BOOK1.title,
        author: TEST_BOOKS.BOOK1.author,
      };

      mockBookService.searchBookByISBN.mockResolvedValue(mockBook);

      const response = await request(app)
        .get(`/api/books/search?isbn=${TEST_BOOKS.BOOK1.isbn}`)
        .set(authHeaders)
        .expect(200);

      expect(response.body).toMatchObject({
        book: expect.objectContaining({
          isbn: TEST_BOOKS.BOOK1.isbn,
          title: TEST_BOOKS.BOOK1.title,
          author: TEST_BOOKS.BOOK1.author,
        }),
      });
    });

    it('POST /api/books/library should add book to library', async () => {
      const mockUserBook = {
        id: 1,
        userId: 1,
        bookId: 1,
        isRead: false,
        book: {
          id: 1,
          isbn: TEST_BOOKS.BOOK1.isbn,
          title: TEST_BOOKS.BOOK1.title,
          author: TEST_BOOKS.BOOK1.author,
        },
      };

      mockBookService.addBookToLibrary.mockResolvedValue(mockUserBook);

      const response = await request(app)
        .post('/api/books/library')
        .set(authHeaders)
        .send({ isbn: TEST_BOOKS.BOOK1.isbn })
        .expect(201);

      expect(response.body).toMatchObject({
        userBook: expect.objectContaining({
          id: 1,
          isRead: false,
        }),
      });
    });

    it('GET /api/books/library should get user library', async () => {
      const mockLibrary = {
        books: [
          {
            id: 1,
            userId: 1,
            bookId: 1,
            isRead: false,
            book: {
              id: 1,
              title: TEST_BOOKS.BOOK1.title,
            },
          },
        ],
        total: 1,
      };

      mockBookService.getUserLibrary.mockResolvedValue(mockLibrary);

      const response = await request(app)
        .get('/api/books/library')
        .set(authHeaders)
        .expect(200);

      expect(response.body).toMatchObject({
        books: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            isRead: false,
          }),
        ]),
        total: 1,
      });
    });

    it('PUT /api/books/library/:id/status should update reading status', async () => {
      const mockUpdatedUserBook = {
        id: 1,
        userId: 1,
        bookId: 1,
        isRead: true,
        readAt: new Date(),
      };

      mockBookService.updateReadingStatus.mockResolvedValue(mockUpdatedUserBook);

      const response = await request(app)
        .put('/api/books/library/1/status')
        .set(authHeaders)
        .send({ isRead: true })
        .expect(200);

      expect(response.body).toMatchObject({
        userBook: expect.objectContaining({
          id: 1,
          isRead: true,
        }),
      });
    });

    it('GET /api/books should search books', async () => {
      const mockSearchResult = {
        books: [
          {
            id: 1,
            title: TEST_BOOKS.BOOK1.title,
            author: TEST_BOOKS.BOOK1.author,
          },
        ],
        total: 1,
      };

      mockBookService.searchBooks.mockResolvedValue(mockSearchResult);

      const response = await request(app)
        .get('/api/books?q=JavaScript')
        .set(authHeaders)
        .expect(200);

      expect(response.body).toMatchObject({
        books: expect.arrayContaining([
          expect.objectContaining({
            title: TEST_BOOKS.BOOK1.title,
          }),
        ]),
        total: 1,
      });
    });
  });

  describe('User Endpoints', () => {
    const authHeaders = { Authorization: 'Bearer test-token' };

    it('GET /api/users/search should search users', async () => {
      const mockSearchResult = {
        users: [
          {
            id: 1,
            username: TEST_USERS.USER1.username,
            email: TEST_USERS.USER1.email,
          },
        ],
        total: 1,
      };

      mockUserService.searchUsers.mockResolvedValue(mockSearchResult);

      const response = await request(app)
        .get('/api/users/search?q=alice')
        .set(authHeaders)
        .expect(200);

      expect(response.body).toMatchObject({
        users: expect.arrayContaining([
          expect.objectContaining({
            username: TEST_USERS.USER1.username,
          }),
        ]),
        total: 1,
      });
    });

    it('POST /api/users/:id/follow should follow user', async () => {
      const mockFollow = {
        id: 1,
        followerId: 1,
        followingId: 2,
        createdAt: new Date(),
      };

      mockUserService.followUser.mockResolvedValue(mockFollow);

      const response = await request(app)
        .post('/api/users/2/follow')
        .set(authHeaders)
        .expect(201);

      expect(response.body).toMatchObject({
        follow: expect.objectContaining({
          followerId: 1,
          followingId: 2,
        }),
      });
    });
  });

  describe('Bookshelf Endpoints', () => {
    const authHeaders = { Authorization: 'Bearer test-token' };

    it('POST /api/bookshelves should create bookshelf', async () => {
      const mockBookshelf = {
        id: 1,
        userId: 1,
        name: 'Test Bookshelf',
        description: 'A test bookshelf',
        isPublic: false,
        createdAt: new Date(),
      };

      mockBookshelfService.createBookshelf.mockResolvedValue(mockBookshelf);

      const response = await request(app)
        .post('/api/bookshelves')
        .set(authHeaders)
        .send({
          name: 'Test Bookshelf',
          description: 'A test bookshelf',
          isPublic: false,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        bookshelf: expect.objectContaining({
          name: 'Test Bookshelf',
          description: 'A test bookshelf',
          isPublic: false,
        }),
      });
    });

    it('GET /api/bookshelves should get user bookshelves', async () => {
      const mockBookshelves = {
        bookshelves: [
          {
            id: 1,
            name: 'Test Bookshelf',
            description: 'A test bookshelf',
            isPublic: false,
          },
        ],
        total: 1,
      };

      mockBookshelfService.getUserBookshelves.mockResolvedValue(mockBookshelves);

      const response = await request(app)
        .get('/api/bookshelves')
        .set(authHeaders)
        .expect(200);

      expect(response.body).toMatchObject({
        bookshelves: expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Bookshelf',
          }),
        ]),
        total: 1,
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for requests without authorization', async () => {
      const response = await request(app)
        .get('/api/books/library')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/books/library')
        .set('Authorization', 'Bearer test-token')
        .send({}) // Missing required isbn field
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});