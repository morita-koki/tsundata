/**
 * BookService Unit Tests
 * Tests all book-related business logic
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BookService } from '../../../services/BookService.js';
import { TEST_BOOKS, TEST_USERS } from '../../fixtures/testData.js';
import type { RepositoryContainer } from '../../../repositories/index.js';
import type { Book, BookInsert, UserBook, UserBookUpdate, ExternalBookData } from '../../../types/index.js';
import {
  DuplicateUserBookError,
  BookNotInLibraryError,
  BookAlreadyReadError,
  ValidationError,
  BusinessLogicError,
} from '../../../errors/index.js';

// Create mock repositories
const createMockBookRepository = () => ({
  findByIsbn: jest.fn(),
  createBook: jest.fn(),
  findUserBook: jest.fn(),
  addToUserLibrary: jest.fn(),
  removeFromUserLibrary: jest.fn(),
  findUserBookById: jest.fn(),
  updateUserBook: jest.fn(),
  getUserLibrary: jest.fn(),
  findById: jest.fn(),
  searchBooks: jest.fn(),
  findBooksByIds: jest.fn(),
});

const createMockUserRepository = () => ({
  findById: jest.fn(),
});

const createMockBookshelfRepository = () => ({});

// Mock BookSearchService
jest.mock('../../../services/BookSearchService.js', () => ({
  BookSearchService: jest.fn().mockImplementation(() => ({
    searchByISBN: jest.fn(),
  })),
}));

describe('BookService', () => {
  let repositories: RepositoryContainer;
  let bookService: BookService;
  let mockBookRepository: ReturnType<typeof createMockBookRepository>;
  let mockUserRepository: ReturnType<typeof createMockUserRepository>;
  let mockBookSearchService: any;
  
  const testBook: Book = {
    id: 1,
    isbn: TEST_BOOKS.BOOK1.isbn,
    title: TEST_BOOKS.BOOK1.title,
    author: TEST_BOOKS.BOOK1.author,
    publisher: TEST_BOOKS.BOOK1.publisher,
    publishedDate: TEST_BOOKS.BOOK1.publishedDate,
    description: TEST_BOOKS.BOOK1.description,
    pageCount: null,
    thumbnail: TEST_BOOKS.BOOK1.thumbnail,
    price: TEST_BOOKS.BOOK1.price,
    series: null,
    createdAt: new Date(),
  };

  const testUserBook: UserBook = {
    id: 1,
    userId: 1,
    bookId: 1,
    isRead: false,
    addedAt: new Date(),
    readAt: null,
  };

  beforeEach(() => {
    mockBookRepository = createMockBookRepository();
    mockUserRepository = createMockUserRepository();
    
    repositories = {
      bookRepository: mockBookRepository,
      userRepository: mockUserRepository,
      bookshelfRepository: createMockBookshelfRepository() as any,
    };

    bookService = new BookService(repositories);
    
    // Get the mocked BookSearchService instance
    mockBookSearchService = (bookService as any).bookSearchService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchBookByISBN', () => {
    it('should return existing book from database', async () => {
      mockBookRepository.findByIsbn.mockResolvedValue(testBook);

      const result = await bookService.searchBookByISBN(TEST_BOOKS.BOOK1.isbn);

      expect(mockBookRepository.findByIsbn).toHaveBeenCalledWith(TEST_BOOKS.BOOK1.isbn);
      expect(result).toEqual(testBook);
      expect(mockBookSearchService.searchByISBN).not.toHaveBeenCalled();
    });

    it('should search external APIs and create new book if not found in database', async () => {
      const externalBookData: ExternalBookData = {
        isbn: TEST_BOOKS.BOOK1.isbn,
        title: TEST_BOOKS.BOOK1.title,
        author: TEST_BOOKS.BOOK1.author,
        publisher: TEST_BOOKS.BOOK1.publisher,
        publishedDate: TEST_BOOKS.BOOK1.publishedDate,
        description: TEST_BOOKS.BOOK1.description,
        thumbnail: TEST_BOOKS.BOOK1.thumbnail,
        price: TEST_BOOKS.BOOK1.price,
      };

      mockBookRepository.findByIsbn.mockResolvedValue(null);
      mockBookSearchService.searchByISBN.mockResolvedValue(externalBookData);
      mockBookRepository.createBook.mockResolvedValue(testBook);

      const result = await bookService.searchBookByISBN(TEST_BOOKS.BOOK1.isbn);

      expect(mockBookRepository.findByIsbn).toHaveBeenCalledWith(TEST_BOOKS.BOOK1.isbn);
      expect(mockBookSearchService.searchByISBN).toHaveBeenCalledWith(TEST_BOOKS.BOOK1.isbn);
      expect(mockBookRepository.createBook).toHaveBeenCalledWith(expect.objectContaining({
        isbn: TEST_BOOKS.BOOK1.isbn,
        title: TEST_BOOKS.BOOK1.title,
        author: TEST_BOOKS.BOOK1.author,
      }));
      expect(result).toEqual(testBook);
    });

    it('should validate ISBN parameter', async () => {
      await expect(bookService.searchBookByISBN(''))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('addBookToLibrary', () => {
    it('should add book to user library successfully', async () => {
      const expectedResponse = {
        ...testUserBook,
        book: testBook,
      };

      mockBookRepository.findByIsbn.mockResolvedValue(testBook);
      mockBookRepository.findUserBook.mockResolvedValue(null);
      mockBookRepository.addToUserLibrary.mockResolvedValue(testUserBook);

      const result = await bookService.addBookToLibrary(TEST_BOOKS.BOOK1.isbn, 1);

      expect(mockBookRepository.findByIsbn).toHaveBeenCalledWith(TEST_BOOKS.BOOK1.isbn);
      expect(mockBookRepository.findUserBook).toHaveBeenCalledWith(1, testBook.id);
      expect(mockBookRepository.addToUserLibrary).toHaveBeenCalledWith(1, testBook.id);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw error if book already in library', async () => {
      mockBookRepository.findByIsbn.mockResolvedValue(testBook);
      mockBookRepository.findUserBook.mockResolvedValue(testUserBook);

      await expect(bookService.addBookToLibrary(TEST_BOOKS.BOOK1.isbn, 1))
        .rejects.toThrow(DuplicateUserBookError);
    });

    it('should validate parameters', async () => {
      await expect(bookService.addBookToLibrary('', 1))
        .rejects.toThrow(ValidationError);

      await expect(bookService.addBookToLibrary(TEST_BOOKS.BOOK1.isbn, -1))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('removeBookFromLibrary', () => {
    it('should remove book from user library successfully', async () => {
      mockBookRepository.findByIsbn.mockResolvedValue(testBook);
      mockBookRepository.findUserBook.mockResolvedValue(testUserBook);
      mockBookRepository.removeFromUserLibrary.mockResolvedValue(undefined);

      await expect(bookService.removeBookFromLibrary(TEST_BOOKS.BOOK1.isbn, 1))
        .resolves.not.toThrow();

      expect(mockBookRepository.findByIsbn).toHaveBeenCalledWith(TEST_BOOKS.BOOK1.isbn);
      expect(mockBookRepository.findUserBook).toHaveBeenCalledWith(1, testBook.id);
      expect(mockBookRepository.removeFromUserLibrary).toHaveBeenCalledWith(1, testBook.id);
    });

    it('should throw error if book not found', async () => {
      mockBookRepository.findByIsbn.mockResolvedValue(null);

      await expect(bookService.removeBookFromLibrary(TEST_BOOKS.BOOK1.isbn, 1))
        .rejects.toThrow(BusinessLogicError);
    });

    it('should throw error if book not in library', async () => {
      mockBookRepository.findByIsbn.mockResolvedValue(testBook);
      mockBookRepository.findUserBook.mockResolvedValue(null);

      await expect(bookService.removeBookFromLibrary(TEST_BOOKS.BOOK1.isbn, 1))
        .rejects.toThrow(BookNotInLibraryError);
    });

    it('should validate parameters', async () => {
      await expect(bookService.removeBookFromLibrary('', 1))
        .rejects.toThrow(ValidationError);

      await expect(bookService.removeBookFromLibrary(TEST_BOOKS.BOOK1.isbn, -1))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('updateReadingStatus', () => {
    it('should mark book as read successfully', async () => {
      const updatedUserBook = { ...testUserBook, isRead: true, readAt: new Date() };

      mockBookRepository.findUserBookById.mockResolvedValue(testUserBook);
      mockBookRepository.updateUserBook.mockResolvedValue(updatedUserBook);

      const result = await bookService.updateReadingStatus(1, true, 1);

      expect(mockBookRepository.findUserBookById).toHaveBeenCalledWith(1);
      expect(mockBookRepository.updateUserBook).toHaveBeenCalledWith(1, expect.objectContaining({
        isRead: true,
        readAt: expect.any(Date),
      }));
      expect(result).toEqual(updatedUserBook);
    });

    it('should mark book as unread successfully', async () => {
      const readUserBook = { ...testUserBook, isRead: true, readAt: new Date() };
      const updatedUserBook = { ...testUserBook, isRead: false, readAt: null };

      mockBookRepository.findUserBookById.mockResolvedValue(readUserBook);
      mockBookRepository.updateUserBook.mockResolvedValue(updatedUserBook);

      const result = await bookService.updateReadingStatus(1, false, 1);

      expect(mockBookRepository.updateUserBook).toHaveBeenCalledWith(1, expect.objectContaining({
        isRead: false,
        readAt: null,
      }));
      expect(result).toEqual(updatedUserBook);
    });

    it('should throw error if book not found', async () => {
      mockBookRepository.findUserBookById.mockResolvedValue(null);

      await expect(bookService.updateReadingStatus(1, true, 1))
        .rejects.toThrow(BusinessLogicError);
    });

    it('should throw error for unauthorized access', async () => {
      const otherUserBook = { ...testUserBook, userId: 2 };
      mockBookRepository.findUserBookById.mockResolvedValue(otherUserBook);

      await expect(bookService.updateReadingStatus(1, true, 1))
        .rejects.toThrow(BusinessLogicError);
    });

    it('should throw error if status unchanged', async () => {
      const readUserBook = { ...testUserBook, isRead: true };
      mockBookRepository.findUserBookById.mockResolvedValue(readUserBook);

      await expect(bookService.updateReadingStatus(1, true, 1))
        .rejects.toThrow(BookAlreadyReadError);
    });

    it('should validate parameters', async () => {
      await expect(bookService.updateReadingStatus(-1, true, 1))
        .rejects.toThrow(ValidationError);

      await expect(bookService.updateReadingStatus(1, true, -1))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getUserLibrary', () => {
    it('should get user library with default options', async () => {
      const libraryResult = {
        books: [{ ...testUserBook, book: testBook }],
        total: 1,
      };

      mockBookRepository.getUserLibrary.mockResolvedValue(libraryResult);

      const result = await bookService.getUserLibrary(1);

      expect(mockBookRepository.getUserLibrary).toHaveBeenCalledWith(1, {
        limit: 20,
        offset: 0,
      });
      expect(result).toEqual(libraryResult);
    });

    it('should get user library with custom options', async () => {
      const libraryResult = {
        books: [{ ...testUserBook, book: testBook }],
        total: 1,
      };

      mockBookRepository.getUserLibrary.mockResolvedValue(libraryResult);

      const result = await bookService.getUserLibrary(1, {
        isRead: true,
        page: 2,
        limit: 10,
        sortBy: 'title',
        sortOrder: 'asc',
      });

      expect(mockBookRepository.getUserLibrary).toHaveBeenCalledWith(1, {
        limit: 10,
        offset: 10,
        isRead: true,
        sortBy: 'title',
        sortOrder: 'asc',
      });
      expect(result).toEqual(libraryResult);
    });

    it('should validate user ID', async () => {
      await expect(bookService.getUserLibrary(-1))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getUserBook', () => {
    it('should get user book with details successfully', async () => {
      const expectedResult = {
        ...testUserBook,
        book: testBook,
      };

      mockBookRepository.findUserBookById.mockResolvedValue(testUserBook);
      mockBookRepository.findById.mockResolvedValue(testBook);

      const result = await bookService.getUserBook(1, 1);

      expect(mockBookRepository.findUserBookById).toHaveBeenCalledWith(1);
      expect(mockBookRepository.findById).toHaveBeenCalledWith(testUserBook.bookId);
      expect(result).toEqual(expectedResult);
    });

    it('should throw error if user book not found', async () => {
      mockBookRepository.findUserBookById.mockResolvedValue(null);

      await expect(bookService.getUserBook(1, 1))
        .rejects.toThrow(BusinessLogicError);
    });

    it('should throw error for unauthorized access', async () => {
      const otherUserBook = { ...testUserBook, userId: 2 };
      mockBookRepository.findUserBookById.mockResolvedValue(otherUserBook);

      await expect(bookService.getUserBook(1, 1))
        .rejects.toThrow(BusinessLogicError);
    });

    it('should validate parameters', async () => {
      await expect(bookService.getUserBook(-1, 1))
        .rejects.toThrow(ValidationError);

      await expect(bookService.getUserBook(1, -1))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('searchBooks', () => {
    it('should search books successfully', async () => {
      const searchResult = {
        books: [testBook],
        total: 1,
      };

      mockBookRepository.searchBooks.mockResolvedValue(searchResult);

      const result = await bookService.searchBooks('JavaScript');

      expect(mockBookRepository.searchBooks).toHaveBeenCalledWith('JavaScript', {
        limit: 20,
        offset: 0,
      });
      expect(result).toEqual(searchResult);
    });

    it('should search books with pagination', async () => {
      const searchResult = {
        books: [testBook],
        total: 5,
      };

      mockBookRepository.searchBooks.mockResolvedValue(searchResult);

      const result = await bookService.searchBooks('JavaScript', { page: 2, limit: 10 });

      expect(mockBookRepository.searchBooks).toHaveBeenCalledWith('JavaScript', {
        limit: 10,
        offset: 10,
      });
      expect(result).toEqual(searchResult);
    });

    it('should validate search query', async () => {
      await expect(bookService.searchBooks(''))
        .rejects.toThrow(ValidationError);

      const longQuery = 'a'.repeat(101);
      await expect(bookService.searchBooks(longQuery))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getBookById', () => {
    it('should get book by ID successfully', async () => {
      mockBookRepository.findById.mockResolvedValue(testBook);

      const result = await bookService.getBookById(1);

      expect(mockBookRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(testBook);
    });

    it('should throw error if book not found', async () => {
      mockBookRepository.findById.mockResolvedValue(null);

      await expect(bookService.getBookById(1))
        .rejects.toThrow(BusinessLogicError);
    });

    it('should validate book ID', async () => {
      await expect(bookService.getBookById(-1))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getBooksByIds', () => {
    it('should get multiple books by IDs successfully', async () => {
      const books = [testBook, { ...testBook, id: 2 }];
      mockBookRepository.findBooksByIds.mockResolvedValue(books);

      const result = await bookService.getBooksByIds([1, 2]);

      expect(mockBookRepository.findBooksByIds).toHaveBeenCalledWith([1, 2]);
      expect(result).toEqual(books);
    });

    it('should return empty array for empty input', async () => {
      const result = await bookService.getBooksByIds([]);

      expect(result).toEqual([]);
      expect(mockBookRepository.findBooksByIds).not.toHaveBeenCalled();
    });

    it('should validate book IDs', async () => {
      await expect(bookService.getBooksByIds([1, -1]))
        .rejects.toThrow(ValidationError);
    });
  });
});