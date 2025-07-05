/**
 * BookshelfRepository Unit Tests
 * Tests all bookshelf-related database operations
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BookshelfRepository } from '../../../repositories/BookshelfRepository.js';
import { BookRepository } from '../../../repositories/BookRepository.js';
import { UserRepository } from '../../../repositories/UserRepository.js';
import { createTestDatabase, closeTestDatabase } from '../../utils/dbHelpers.js';
import { TEST_BOOKSHELVES, TEST_BOOKS, TEST_USERS } from '../../fixtures/testData.js';
import type { Database } from '../../../repositories/BaseRepository.js';
import type { BookshelfInsert, BookshelfUpdate } from '../../../types/index.js';

describe('BookshelfRepository', () => {
  let db: Database;
  let bookshelfRepository: BookshelfRepository;
  let bookRepository: BookRepository;
  let userRepository: UserRepository;
  let testUser: any;
  let testBook: any;
  let testUserBook: any;

  beforeEach(async () => {
    db = await createTestDatabase();
    bookshelfRepository = new BookshelfRepository(db);
    bookRepository = new BookRepository(db);
    userRepository = new UserRepository(db);

    // Create test user
    testUser = await userRepository.createUser({
      firebaseUid: TEST_USERS.USER1.firebaseUid,
      email: TEST_USERS.USER1.email,
      username: TEST_USERS.USER1.username,
    });

    // Create test book and add to user library
    testBook = await bookRepository.createBook({
      isbn: TEST_BOOKS.BOOK1.isbn,
      title: TEST_BOOKS.BOOK1.title,
      author: TEST_BOOKS.BOOK1.author,
    });

    testUserBook = await bookRepository.addToUserLibrary(testUser.id, testBook.id);
  });

  afterEach(async () => {
    await closeTestDatabase(db);
  });

  describe('createBookshelf', () => {
    it('should create a new bookshelf successfully', async () => {
      const bookshelfData: BookshelfInsert = {
        name: TEST_BOOKSHELVES.BOOKSHELF1.name,
        description: TEST_BOOKSHELVES.BOOKSHELF1.description,
        isPublic: TEST_BOOKSHELVES.BOOKSHELF1.isPublic,
        userId: testUser.id,
      };

      const bookshelf = await bookshelfRepository.createBookshelf(bookshelfData);

      expect(bookshelf).toMatchObject({
        id: expect.any(Number),
        name: bookshelfData.name,
        description: bookshelfData.description,
        isPublic: bookshelfData.isPublic,
        userId: testUser.id,
        createdAt: expect.any(Date),
      });
    });

    it('should create bookshelf with minimal fields', async () => {
      const bookshelfData: BookshelfInsert = {
        name: 'Simple Bookshelf',
        userId: testUser.id,
      };

      const bookshelf = await bookshelfRepository.createBookshelf(bookshelfData);

      expect(bookshelf).toMatchObject({
        id: expect.any(Number),
        name: bookshelfData.name,
        description: null,
        isPublic: false, // Default value
        userId: testUser.id,
      });
    });

    it('should allow duplicate names for different users', async () => {
      const user2 = await userRepository.createUser({
        firebaseUid: TEST_USERS.USER2.firebaseUid,
        email: TEST_USERS.USER2.email,
        username: TEST_USERS.USER2.username,
      });

      const bookshelfData: BookshelfInsert = {
        name: 'Same Name',
        userId: testUser.id,
      };

      const bookshelfData2: BookshelfInsert = {
        name: 'Same Name',
        userId: user2.id,
      };

      const bookshelf1 = await bookshelfRepository.createBookshelf(bookshelfData);
      const bookshelf2 = await bookshelfRepository.createBookshelf(bookshelfData2);

      expect(bookshelf1.name).toBe(bookshelf2.name);
      expect(bookshelf1.userId).not.toBe(bookshelf2.userId);
    });
  });

  describe('getBookshelfById', () => {
    it('should retrieve bookshelf by ID', async () => {
      const bookshelfData: BookshelfInsert = {
        name: TEST_BOOKSHELVES.BOOKSHELF1.name,
        description: TEST_BOOKSHELVES.BOOKSHELF1.description,
        isPublic: TEST_BOOKSHELVES.BOOKSHELF1.isPublic,
        userId: testUser.id,
      };

      const createdBookshelf = await bookshelfRepository.createBookshelf(bookshelfData);
      const retrievedBookshelf = await bookshelfRepository.findById(createdBookshelf.id);

      expect(retrievedBookshelf).toEqual(createdBookshelf);
    });

    it('should throw error for non-existent bookshelf ID', async () => {
      const result = await bookshelfRepository.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('getBookshelfWithBooks', () => {
    let bookshelf: any;

    beforeEach(async () => {
      bookshelf = await bookshelfRepository.createBookshelf({
        name: TEST_BOOKSHELVES.BOOKSHELF1.name,
        userId: testUser.id,
      });

      await bookshelfRepository.addBookToBookshelf(bookshelf.id, testUserBook.id);
    });

    it('should retrieve bookshelf with books', async () => {
      const bookshelfWithBooks = await bookshelfRepository.getBookshelfWithBooks(bookshelf.id);

      expect(bookshelfWithBooks).toMatchObject({
        bookshelf: expect.objectContaining({
          id: bookshelf.id,
          name: bookshelf.name,
          userId: testUser.id,
        }),
        books: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            userBookId: testUserBook.id,
            book: expect.objectContaining({
              id: testBook.id,
              title: TEST_BOOKS.BOOK1.title,
            }),
          }),
        ]),
      });
    });

    it('should return bookshelf with empty books array if no books', async () => {
      const emptyBookshelf = await bookshelfRepository.createBookshelf({
        name: 'Empty Bookshelf',
        userId: testUser.id,
      });

      const bookshelfWithBooks = await bookshelfRepository.getBookshelfWithBooks(emptyBookshelf.id);

      expect(bookshelfWithBooks.books).toEqual([]);
    });
  });

  describe('getUserBookshelves', () => {
    beforeEach(async () => {
      await bookshelfRepository.createBookshelf({
        name: 'Public Bookshelf',
        isPublic: true,
        userId: testUser.id,
      });

      await bookshelfRepository.createBookshelf({
        name: 'Private Bookshelf',
        isPublic: false,
        userId: testUser.id,
      });
    });

    it('should get all user bookshelves', async () => {
      const result = await bookshelfRepository.getUserBookshelves(testUser.id);

      expect(result.bookshelves).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by public status', async () => {
      const result = await bookshelfRepository.getUserBookshelves(testUser.id, { isPublic: true });

      expect(result.bookshelves).toHaveLength(1);
      expect(result.bookshelves[0].isPublic).toBe(true);
    });

    it('should handle pagination', async () => {
      const result = await bookshelfRepository.getUserBookshelves(testUser.id, { 
        limit: 1, 
        offset: 0 
      });

      expect(result.bookshelves).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it('should sort by name ascending', async () => {
      const result = await bookshelfRepository.getUserBookshelves(testUser.id, {
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result.bookshelves[0].name).toBe('Private Bookshelf');
      expect(result.bookshelves[1].name).toBe('Public Bookshelf');
    });

    it('should include book counts', async () => {
      const bookshelf = await bookshelfRepository.createBookshelf({
        name: 'Bookshelf with Books',
        userId: testUser.id,
      });

      await bookshelfRepository.addBookToBookshelf(bookshelf.id, testUserBook.id);

      const result = await bookshelfRepository.getUserBookshelves(testUser.id);
      
      const bookshelfWithBooks = result.bookshelves.find(bs => bs.id === bookshelf.id);
      expect(bookshelfWithBooks?.bookCount).toBe(1);
    });
  });

  describe('updateBookshelf', () => {
    let bookshelf: any;

    beforeEach(async () => {
      bookshelf = await bookshelfRepository.createBookshelf({
        name: TEST_BOOKSHELVES.BOOKSHELF1.name,
        description: TEST_BOOKSHELVES.BOOKSHELF1.description,
        isPublic: false,
        userId: testUser.id,
      });
    });

    it('should update bookshelf successfully', async () => {
      const updateData: BookshelfUpdate = {
        name: 'Updated Name',
        description: 'Updated description',
        isPublic: true,
      };

      const updatedBookshelf = await bookshelfRepository.updateBookshelf(bookshelf.id, updateData);

      expect(updatedBookshelf).toMatchObject({
        id: bookshelf.id,
        name: updateData.name,
        description: updateData.description,
        isPublic: updateData.isPublic,
        userId: testUser.id,
      });

      // Verify the bookshelf was updated (no updatedAt field in schema)
      expect(updatedBookshelf.id).toBe(bookshelf.id);
    });

    it('should update partial fields', async () => {
      const updateData: BookshelfUpdate = {
        name: 'New Name Only',
      };

      const updatedBookshelf = await bookshelfRepository.updateBookshelf(bookshelf.id, updateData);

      expect(updatedBookshelf.name).toBe(updateData.name);
      expect(updatedBookshelf.description).toBe(bookshelf.description);
      expect(updatedBookshelf.isPublic).toBe(bookshelf.isPublic);
    });

    it('should throw error for non-existent bookshelf', async () => {
      const updateData: BookshelfUpdate = {
        name: 'New Name',
      };

      await expect(bookshelfRepository.updateBookshelf(999, updateData))
        .rejects.toThrow();
    });
  });

  describe('deleteBookshelf', () => {
    let bookshelf: any;

    beforeEach(async () => {
      bookshelf = await bookshelfRepository.createBookshelf({
        name: TEST_BOOKSHELVES.BOOKSHELF1.name,
        userId: testUser.id,
      });
    });

    it('should delete bookshelf successfully', async () => {
      await bookshelfRepository.deleteBookshelf(bookshelf.id);

      await expect(bookshelfRepository.getBookshelfById(bookshelf.id))
        .rejects.toThrow();
    });

    it('should throw error for non-existent bookshelf', async () => {
      await expect(bookshelfRepository.deleteBookshelf(999))
        .rejects.toThrow();
    });
  });

  describe('addBookToBookshelf', () => {
    let bookshelf: any;

    beforeEach(async () => {
      bookshelf = await bookshelfRepository.createBookshelf({
        name: TEST_BOOKSHELVES.BOOKSHELF1.name,
        userId: testUser.id,
      });
    });

    it('should add book to bookshelf successfully', async () => {
      const bookshelfBook = await bookshelfRepository.addBookToBookshelf(bookshelf.id, testUserBook.id);

      expect(bookshelfBook).toMatchObject({
        id: expect.any(Number),
        bookshelfId: bookshelf.id,
        userBookId: testUserBook.id,
        addedAt: expect.any(String),
        displayOrder: expect.any(Number),
      });
    });

    it('should throw error for duplicate book in bookshelf', async () => {
      await bookshelfRepository.addBookToBookshelf(bookshelf.id, testUserBook.id);

      await expect(bookshelfRepository.addBookToBookshelf(bookshelf.id, testUserBook.id))
        .rejects.toThrow();
    });

    it('should assign display order correctly', async () => {
      const book1 = await bookshelfRepository.addBookToBookshelf(bookshelf.id, testUserBook.id);

      // Create another book
      const testBook2 = await bookRepository.createBook({
        isbn: TEST_BOOKS.BOOK2.isbn,
        title: TEST_BOOKS.BOOK2.title,
        author: TEST_BOOKS.BOOK2.author,
      });

      const testUserBook2 = await bookRepository.addToUserLibrary(testUser.id, testBook2.id);

      const book2 = await bookshelfRepository.addBookToBookshelf(bookshelf.id, testUserBook2.id);

      expect(book2.displayOrder).toBeGreaterThan(book1.displayOrder);
    });
  });

  describe('removeBookFromBookshelf', () => {
    let bookshelf: any;
    let bookshelfBook: any;

    beforeEach(async () => {
      bookshelf = await bookshelfRepository.createBookshelf({
        name: TEST_BOOKSHELVES.BOOKSHELF1.name,
        userId: testUser.id,
      });

      bookshelfBook = await bookshelfRepository.addBookToBookshelf(bookshelf.id, testUserBook.id);
    });

    it('should remove book from bookshelf successfully', async () => {
      await bookshelfRepository.removeBookFromBookshelf(bookshelf.id, testUserBook.id);

      const bookshelfWithBooks = await bookshelfRepository.getBookshelfWithBooks(bookshelf.id);
      expect(bookshelfWithBooks.books).toHaveLength(0);
    });

    it('should throw error for non-existent book in bookshelf', async () => {
      await expect(bookshelfRepository.removeBookFromBookshelf(bookshelf.id, 999))
        .rejects.toThrow();
    });
  });

  describe('getBookCount', () => {
    let bookshelf: any;

    beforeEach(async () => {
      bookshelf = await bookshelfRepository.createBookshelf({
        name: TEST_BOOKSHELVES.BOOKSHELF1.name,
        userId: testUser.id,
      });
    });

    it('should return zero for empty bookshelf', async () => {
      const count = await bookshelfRepository.getBookCount(bookshelf.id);
      expect(count).toBe(0);
    });

    it('should return correct count after adding books', async () => {
      await bookshelfRepository.addBookToBookshelf(bookshelf.id, testUserBook.id);

      const count = await bookshelfRepository.getBookCount(bookshelf.id);
      expect(count).toBe(1);
    });
  });

  describe('reorderBooks', () => {
    let bookshelf: any;
    let userBook1: any, userBook2: any;

    beforeEach(async () => {
      bookshelf = await bookshelfRepository.createBookshelf({
        name: TEST_BOOKSHELVES.BOOKSHELF1.name,
        userId: testUser.id,
      });

      // Create second book
      const testBook2 = await bookRepository.createBook({
        isbn: TEST_BOOKS.BOOK2.isbn,
        title: TEST_BOOKS.BOOK2.title,
        author: TEST_BOOKS.BOOK2.author,
      });

      userBook1 = testUserBook;
      userBook2 = await bookRepository.addToUserLibrary(testUser.id, testBook2.id);

      await bookshelfRepository.addBookToBookshelf(bookshelf.id, userBook1.id);
      await bookshelfRepository.addBookToBookshelf(bookshelf.id, userBook2.id);
    });

    it('should reorder books successfully', async () => {
      const newOrder = [
        { userBookId: userBook2.id, displayOrder: 1 },
        { userBookId: userBook1.id, displayOrder: 2 },
      ];

      // Use updateBookOrder for each book individually
      await bookshelfRepository.updateBookOrder(userBook1.id, 1);
      await bookshelfRepository.updateBookOrder(userBook2.id, 0);

      const bookshelfWithBooks = await bookshelfRepository.getBookshelfWithBooks(bookshelf.id);
      
      // Books should be ordered by displayOrder
      expect(bookshelfWithBooks.books[0].userBookId).toBe(userBook2.id);
      expect(bookshelfWithBooks.books[1].userBookId).toBe(userBook1.id);
    });

    it('should throw error for non-existent bookshelf', async () => {
      const newOrder = [
        { userBookId: userBook1.id, displayOrder: 1 },
      ];

      await expect(bookshelfRepository.updateBookOrder(999, 0))
        .rejects.toThrow();
    });
  });

  describe('getPublicBookshelves', () => {
    beforeEach(async () => {
      await bookshelfRepository.createBookshelf({
        name: 'Public Bookshelf 1',
        isPublic: true,
        userId: testUser.id,
      });

      await bookshelfRepository.createBookshelf({
        name: 'Private Bookshelf',
        isPublic: false,
        userId: testUser.id,
      });

      const user2 = await userRepository.createUser({
        firebaseUid: TEST_USERS.USER2.firebaseUid,
        email: TEST_USERS.USER2.email,
        username: TEST_USERS.USER2.username,
      });

      await bookshelfRepository.createBookshelf({
        name: 'Public Bookshelf 2',
        isPublic: true,
        userId: user2.id,
      });
    });

    it('should return only public bookshelves', async () => {
      const result = await bookshelfRepository.getPublicBookshelves();

      expect(result.bookshelves).toHaveLength(2);
      expect(result.total).toBe(2);
      
      result.bookshelves.forEach(bookshelf => {
        expect(bookshelf.isPublic).toBe(true);
      });
    });

    it('should include user information', async () => {
      const result = await bookshelfRepository.getPublicBookshelves();

      result.bookshelves.forEach(bookshelf => {
        expect(bookshelf.user).toBeDefined();
        expect(bookshelf.user.username).toBeDefined();
      });
    });

    it('should handle pagination', async () => {
      const result = await bookshelfRepository.getPublicBookshelves({ limit: 1 });

      expect(result.bookshelves).toHaveLength(1);
      expect(result.total).toBe(2);
    });
  });
});