/**
 * BookRepository Unit Tests
 * Tests all book-related database operations
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BookRepository } from '../../../repositories/BookRepository.js';
import { UserRepository } from '../../../repositories/UserRepository.js';
import { createTestDatabase, closeTestDatabase } from '../../utils/dbHelpers.js';
import { TEST_BOOKS, TEST_USERS } from '../../fixtures/testData.js';
import type { Database } from '../../../repositories/BaseRepository.js';
import type { BookInsert, UserBookInsert } from '../../../types/index.js';
import { DatabaseError } from '../../../errors/index.js';

describe('BookRepository', () => {
  let db: Database;
  let bookRepository: BookRepository;
  let userRepository: UserRepository;
  let testUser: any;

  beforeEach(async () => {
    db = await createTestDatabase();
    bookRepository = new BookRepository(db);
    userRepository = new UserRepository(db);

    // Create test user
    testUser = await userRepository.createUser({
      firebaseUid: TEST_USERS.USER1.firebaseUid,
      email: TEST_USERS.USER1.email,
      username: TEST_USERS.USER1.username,
    });
  });

  afterEach(async () => {
    await closeTestDatabase(db);
  });

  describe('createBook', () => {
    it('should create a new book successfully', async () => {
      const bookData: BookInsert = {
        isbn: TEST_BOOKS.BOOK1.isbn,
        title: TEST_BOOKS.BOOK1.title,
        author: TEST_BOOKS.BOOK1.author,
        publisher: TEST_BOOKS.BOOK1.publisher,
        publishedDate: TEST_BOOKS.BOOK1.publishedDate,
        description: TEST_BOOKS.BOOK1.description,
        thumbnail: TEST_BOOKS.BOOK1.thumbnail,
        price: TEST_BOOKS.BOOK1.price,
      };

      const book = await bookRepository.createBook(bookData);

      expect(book).toMatchObject({
        id: expect.any(Number),
        isbn: bookData.isbn,
        title: bookData.title,
        author: bookData.author,
        publisher: bookData.publisher,
        publishedDate: bookData.publishedDate,
        description: bookData.description,
        thumbnail: bookData.thumbnail,
        price: bookData.price,
        createdAt: expect.any(Date),
      });
    });

    it('should throw error for duplicate ISBN', async () => {
      const bookData: BookInsert = {
        isbn: TEST_BOOKS.BOOK1.isbn,
        title: TEST_BOOKS.BOOK1.title,
        author: TEST_BOOKS.BOOK1.author,
        publisher: TEST_BOOKS.BOOK1.publisher,
        publishedDate: TEST_BOOKS.BOOK1.publishedDate,
      };

      await bookRepository.createBook(bookData);

      await expect(bookRepository.createBook(bookData))
        .rejects.toThrow();
    });

    it('should create book with minimal required fields', async () => {
      const bookData: BookInsert = {
        isbn: TEST_BOOKS.BOOK2.isbn,
        title: TEST_BOOKS.BOOK2.title,
        author: TEST_BOOKS.BOOK2.author,
      };

      const book = await bookRepository.createBook(bookData);

      expect(book).toMatchObject({
        id: expect.any(Number),
        isbn: bookData.isbn,
        title: bookData.title,
        author: bookData.author,
        publisher: null,
        publishedDate: null,
        description: null,
        thumbnail: null,
        price: null,
      });
    });
  });

  describe('findById', () => {
    it('should retrieve book by ID', async () => {
      const bookData: BookInsert = {
        isbn: TEST_BOOKS.BOOK1.isbn,
        title: TEST_BOOKS.BOOK1.title,
        author: TEST_BOOKS.BOOK1.author,
      };

      const createdBook = await bookRepository.createBook(bookData);
      const retrievedBook = await bookRepository.findById(createdBook.id);

      expect(retrievedBook).toEqual(createdBook);
    });

    it('should return null for non-existent book ID', async () => {
      const result = await bookRepository.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('findByIsbn', () => {
    it('should retrieve book by ISBN', async () => {
      const bookData: BookInsert = {
        isbn: TEST_BOOKS.BOOK1.isbn,
        title: TEST_BOOKS.BOOK1.title,
        author: TEST_BOOKS.BOOK1.author,
      };

      const createdBook = await bookRepository.createBook(bookData);
      const retrievedBook = await bookRepository.findByIsbn(bookData.isbn);

      expect(retrievedBook).toEqual(createdBook);
    });

    it('should return null for non-existent ISBN', async () => {
      const retrievedBook = await bookRepository.findByIsbn('9999999999999');
      expect(retrievedBook).toBeNull();
    });
  });

  describe('searchBooks', () => {
    beforeEach(async () => {
      // Create test books
      await bookRepository.createBook({
        isbn: TEST_BOOKS.BOOK1.isbn,
        title: TEST_BOOKS.BOOK1.title,
        author: TEST_BOOKS.BOOK1.author,
      });

      await bookRepository.createBook({
        isbn: TEST_BOOKS.BOOK2.isbn,
        title: TEST_BOOKS.BOOK2.title,
        author: TEST_BOOKS.BOOK2.author,
      });
    });

    it('should search books by title', async () => {
      const result = await bookRepository.searchBooks('JavaScript', { limit: 10, offset: 0 });

      expect(result.books).toHaveLength(1);
      expect(result.books[0].title).toBe(TEST_BOOKS.BOOK1.title);
      expect(result.total).toBe(1);
    });

    it('should search books by author', async () => {
      const result = await bookRepository.searchBooks('鈴木一郎', { limit: 10, offset: 0 });

      expect(result.books).toHaveLength(1);
      expect(result.books[0].author).toBe(TEST_BOOKS.BOOK2.author);
      expect(result.total).toBe(1);
    });

    it('should search books by ISBN', async () => {
      const result = await bookRepository.searchBooks(TEST_BOOKS.BOOK1.isbn, { limit: 10, offset: 0 });

      expect(result.books).toHaveLength(1);
      expect(result.books[0].isbn).toBe(TEST_BOOKS.BOOK1.isbn);
      expect(result.total).toBe(1);
    });

    it('should return empty result for no matches', async () => {
      const result = await bookRepository.searchBooks('nonexistent', { limit: 10, offset: 0 });

      expect(result.books).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const result = await bookRepository.searchBooks('プログラミング', { limit: 1, offset: 0 });

      expect(result.books).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('addToUserLibrary', () => {
    let testBook: any;

    beforeEach(async () => {
      testBook = await bookRepository.createBook({
        isbn: TEST_BOOKS.BOOK1.isbn,
        title: TEST_BOOKS.BOOK1.title,
        author: TEST_BOOKS.BOOK1.author,
      });
    });

    it('should add book to user library', async () => {
      const userBook = await bookRepository.addToUserLibrary(testUser.id, testBook.id);

      expect(userBook).toMatchObject({
        id: expect.any(Number),
        userId: testUser.id,
        bookId: testBook.id,
        isRead: false,
        addedAt: expect.any(Date),
        readAt: null,
      });
    });

    it('should add book as read', async () => {
      const userBook = await bookRepository.addToUserLibrary(testUser.id, testBook.id);
      
      // Mark as read after adding
      const updatedUserBook = await bookRepository.updateUserBook(userBook.id, { isRead: true });

      expect(updatedUserBook.isRead).toBe(true);
      expect(updatedUserBook.readAt).not.toBeNull();
    });

    it('should throw error for duplicate user-book combination', async () => {
      await bookRepository.addToUserLibrary(testUser.id, testBook.id);

      await expect(bookRepository.addToUserLibrary(testUser.id, testBook.id))
        .rejects.toThrow();
    });
  });

  describe('getUserLibrary', () => {
    let testBook1: any, testBook2: any;

    beforeEach(async () => {
      testBook1 = await bookRepository.createBook({
        isbn: TEST_BOOKS.BOOK1.isbn,
        title: TEST_BOOKS.BOOK1.title,
        author: TEST_BOOKS.BOOK1.author,
      });

      testBook2 = await bookRepository.createBook({
        isbn: TEST_BOOKS.BOOK2.isbn,
        title: TEST_BOOKS.BOOK2.title,
        author: TEST_BOOKS.BOOK2.author,
      });

      await bookRepository.addToUserLibrary(testUser.id, testBook1.id);

      const userBook2 = await bookRepository.addToUserLibrary(testUser.id, testBook2.id);
      await bookRepository.updateUserBook(userBook2.id, { isRead: true });
    });

    it('should get user library with books', async () => {
      const result = await bookRepository.getUserLibrary(testUser.id, { limit: 10, offset: 0 });

      expect(result.books).toHaveLength(2);
      expect(result.total).toBe(2);

      // Check that books are included
      expect(result.books[0].book).toBeDefined();
      expect(result.books[1].book).toBeDefined();
    });

    it('should filter by read status', async () => {
      const result = await bookRepository.getUserLibrary(testUser.id, { 
        limit: 10, 
        offset: 0, 
        isRead: true 
      });

      expect(result.books).toHaveLength(1);
      expect(result.books[0].isRead).toBe(true);
      expect(result.total).toBe(1);
    });

    it('should handle pagination', async () => {
      const result = await bookRepository.getUserLibrary(testUser.id, { 
        limit: 1, 
        offset: 0 
      });

      expect(result.books).toHaveLength(1);
      expect(result.total).toBe(2);
    });
  });

  describe('findUserBookById', () => {
    let userBook: any;

    beforeEach(async () => {
      const testBook = await bookRepository.createBook({
        isbn: TEST_BOOKS.BOOK1.isbn,
        title: TEST_BOOKS.BOOK1.title,
        author: TEST_BOOKS.BOOK1.author,
      });

      userBook = await bookRepository.addToUserLibrary(testUser.id, testBook.id);
    });

    it('should retrieve user book by ID', async () => {
      const retrievedUserBook = await bookRepository.findUserBookById(userBook.id);

      expect(retrievedUserBook).toMatchObject({
        id: userBook.id,
        userId: testUser.id,
        bookId: userBook.bookId,
        isRead: false,
      });
    });

    it('should return null for non-existent user book ID', async () => {
      const result = await bookRepository.findUserBookById(999);
      expect(result).toBeNull();
    });
  });

  describe('updateUserBook', () => {
    let userBook: any;

    beforeEach(async () => {
      const testBook = await bookRepository.createBook({
        isbn: TEST_BOOKS.BOOK1.isbn,
        title: TEST_BOOKS.BOOK1.title,
        author: TEST_BOOKS.BOOK1.author,
      });

      userBook = await bookRepository.addToUserLibrary(testUser.id, testBook.id);
    });

    it('should mark book as read', async () => {
      const updatedUserBook = await bookRepository.updateUserBook(userBook.id, { isRead: true });

      expect(updatedUserBook.isRead).toBe(true);
      expect(updatedUserBook.readAt).not.toBeNull();
    });

    it('should mark book as unread', async () => {
      // First mark as read
      await bookRepository.updateUserBook(userBook.id, { isRead: true });
      
      // Then mark as unread
      const updatedUserBook = await bookRepository.updateUserBook(userBook.id, { isRead: false });

      expect(updatedUserBook.isRead).toBe(false);
      expect(updatedUserBook.readAt).toBeNull();
    });

    it('should throw error for non-existent user book', async () => {
      await expect(bookRepository.updateUserBook(999, { isRead: true }))
        .rejects.toThrow();
    });
  });

  describe('removeFromUserLibrary', () => {
    let userBook: any;

    beforeEach(async () => {
      const testBook = await bookRepository.createBook({
        isbn: TEST_BOOKS.BOOK1.isbn,
        title: TEST_BOOKS.BOOK1.title,
        author: TEST_BOOKS.BOOK1.author,
      });

      userBook = await bookRepository.addToUserLibrary(testUser.id, testBook.id);
    });

    it('should remove book from user library', async () => {
      await bookRepository.removeFromUserLibrary(testUser.id, userBook.bookId);

      const result = await bookRepository.findUserBookById(userBook.id);
      expect(result).toBeNull();
    });

    it('should throw error for non-existent user-book combination', async () => {
      await expect(bookRepository.removeFromUserLibrary(999, userBook.bookId))
        .rejects.toThrow(DatabaseError);
    });
  });
});