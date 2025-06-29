/**
 * Book Service
 * Handles book-related business logic
 */

import { BaseService } from './BaseService.js';
import { BookSearchService } from './BookSearchService.js';
import type { RepositoryContainer } from '../repositories/index.js';
import type { 
  Book, 
  BookInsert,
  UserBook,
  UserBookUpdate,
  BookAddResponse,
  UserBooksResponse
} from '../types/index.js';
import {
  DuplicateUserBookError,
  BookNotInLibraryError,
  BookAlreadyReadError,
} from '../errors/index.js';

export class BookService extends BaseService {
  private bookSearchService: BookSearchService;

  constructor(repositories: RepositoryContainer) {
    super(repositories);
    this.bookSearchService = new BookSearchService(repositories);
  }

  /**
   * Searches for a book by ISBN and returns book information
   */
  async searchBookByISBN(isbn: string): Promise<Book> {
    this.validateNotEmpty(isbn, 'ISBN');

    // First check if book already exists in database
    const existingBook = await this.repositories.bookRepository.findByIsbn(isbn);
    if (existingBook) {
      console.log(`📖 Found existing book in database: ${existingBook.title}`);
      return existingBook;
    }

    // Search external APIs
    console.log(`🔍 Searching external APIs for ISBN: ${isbn}`);
    const externalBookData = await this.bookSearchService.searchByISBN(isbn);

    // Create book in database
    const bookData: BookInsert = {
      isbn: externalBookData.isbn,
      title: externalBookData.title,
      author: externalBookData.author,
      publisher: externalBookData.publisher ?? null,
      publishedDate: externalBookData.publishedDate ?? null,
      description: externalBookData.description ?? null,
      pageCount: externalBookData.pageCount ?? null,
      thumbnail: externalBookData.thumbnail ?? null,
      price: externalBookData.price ?? null,
      series: externalBookData.series ?? null,
    };

    return await this.repositories.bookRepository.createBook(bookData);
  }

  /**
   * Adds a book to user's library
   */
  async addBookToLibrary(isbn: string, userId: number): Promise<BookAddResponse> {
    this.validateNotEmpty(isbn, 'ISBN');
    this.validatePositive(userId, 'User ID');

    // Get or create book
    const book = await this.searchBookByISBN(isbn);

    // Check if book is already in user's library
    const existingUserBook = await this.repositories.bookRepository.findUserBook(userId, book.id);
    if (existingUserBook) {
      throw new DuplicateUserBookError(userId, book.id);
    }

    // Add to library
    const userBook = await this.repositories.bookRepository.addToUserLibrary(userId, book.id);

    return {
      ...userBook,
      book,
    };
  }

  /**
   * Removes a book from user's library
   */
  async removeBookFromLibrary(isbn: string, userId: number): Promise<void> {
    this.validateNotEmpty(isbn, 'ISBN');
    this.validatePositive(userId, 'User ID');

    // Find book
    const book = await this.repositories.bookRepository.findByIsbn(isbn);
    this.validateResourceExists(book, 'Book', isbn);

    // Check if book is in user's library
    const userBook = await this.repositories.bookRepository.findUserBook(userId, book.id);
    if (!userBook) {
      throw new BookNotInLibraryError(isbn);
    }

    return await this.repositories.bookRepository.removeFromUserLibrary(userId, book.id);
  }

  /**
   * Updates reading status of a book in user's library
   */
  async updateReadingStatus(userBookId: number, isRead: boolean, userId: number): Promise<UserBook> {
    this.validatePositive(userBookId, 'User Book ID');
    this.validatePositive(userId, 'User ID');

    // Find user book
    const userBook = await this.repositories.bookRepository.findUserBookById(userBookId);
    this.validateResourceExists(userBook, 'UserBook', userBookId);

    // Verify ownership
    this.validateOwnership(userBook.userId, userId, 'UserBook', userBookId);

    // Check current status
    if (userBook.isRead === isRead) {
      const status = isRead ? 'read' : 'unread';
      throw new BookAlreadyReadError(`Book is already marked as ${status}`);
    }

    const updates: UserBookUpdate = {
      isRead,
      readAt: isRead ? new Date() : null,
    };

    return await this.repositories.bookRepository.updateUserBook(userBookId, updates);
  }

  /**
   * Gets user's library with optional filtering
   */
  async getUserLibrary(
    userId: number,
    options: {
      isRead?: boolean;
      page?: number;
      limit?: number;
      sortBy?: 'addedAt' | 'readAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<UserBooksResponse> {
    this.validatePositive(userId, 'User ID');

    const { validatedLimit, offset } = this.validatePagination(options.page, options.limit);

    const repositoryOptions: any = {
      limit: validatedLimit,
      offset,
    };
    
    if (options.isRead !== undefined) {
      repositoryOptions.isRead = options.isRead;
    }
    if (options.sortBy !== undefined) {
      repositoryOptions.sortBy = options.sortBy;
    }
    if (options.sortOrder !== undefined) {
      repositoryOptions.sortOrder = options.sortOrder;
    }
    
    const result = await this.repositories.bookRepository.getUserLibrary(userId, repositoryOptions);

    return {
      books: result.books,
      total: result.total,
    };
  }

  /**
   * Gets a specific user book with details
   */
  async getUserBook(userBookId: number, userId: number): Promise<UserBook & { book: Book }> {
    this.validatePositive(userBookId, 'User Book ID');
    this.validatePositive(userId, 'User ID');

    // Find user book
    const userBook = await this.repositories.bookRepository.findUserBookById(userBookId);
    this.validateResourceExists(userBook, 'UserBook', userBookId);

    // Verify ownership
    this.validateOwnership(userBook.userId, userId, 'UserBook', userBookId);

    // Get book details
    const book = await this.repositories.bookRepository.findById(userBook.bookId);
    this.validateResourceExists(book, 'Book', userBook.bookId);

    return {
      ...userBook,
      book,
    };
  }

  /**
   * Searches books in the database
   */
  async searchBooks(
    query: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ books: Book[]; total: number }> {
    this.validateNotEmpty(query, 'search query');
    this.validateLength(query, 1, 100, 'search query');

    const { validatedLimit, offset } = this.validatePagination(options.page, options.limit);

    return await this.repositories.bookRepository.searchBooks(query, {
      limit: validatedLimit,
      offset,
    });
  }

  /**
   * Gets a book by ID
   */
  async getBookById(id: number): Promise<Book> {
    this.validatePositive(id, 'Book ID');

    const book = await this.repositories.bookRepository.findById(id);
    this.validateResourceExists(book, 'Book', id);

    return book;
  }

  /**
   * Gets multiple books by IDs
   */
  async getBooksByIds(ids: number[]): Promise<Book[]> {
    if (ids.length === 0) {
      return [];
    }

    // Validate all IDs
    ids.forEach(id => this.validatePositive(id, 'Book ID'));

    return await this.repositories.bookRepository.findBooksByIds(ids);
  }

  /**
   * Updates book information (admin operation)
   */
  async updateBook(id: number, updates: Partial<BookInsert>): Promise<Book> {
    this.validatePositive(id, 'Book ID');

    // Verify book exists
    await this.getBookById(id);

    // Validate update data
    if (updates.title) {
      this.validateNotEmpty(updates.title, 'title');
      this.validateLength(updates.title, 1, 500, 'title');
    }

    if (updates.author) {
      this.validateNotEmpty(updates.author, 'author');
      this.validateLength(updates.author, 1, 200, 'author');
    }

    if (updates.isbn) {
      this.validateNotEmpty(updates.isbn, 'ISBN');
    }

    return await this.repositories.bookRepository.updateBook(id, updates);
  }

  /**
   * Deletes a book (admin operation)
   */
  async deleteBook(id: number): Promise<void> {
    this.validatePositive(id, 'Book ID');

    // Verify book exists
    await this.getBookById(id);

    return await this.repositories.bookRepository.deleteBook(id);
  }
}