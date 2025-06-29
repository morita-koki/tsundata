/**
 * Bookshelf Service
 * Handles bookshelf-related business logic
 */

import { BaseService } from './BaseService.js';
import type { RepositoryContainer } from '../repositories/index.js';
import type { 
  Bookshelf, 
  BookshelfInsert, 
  BookshelfUpdate,
  BookshelfDetailResponse,
  BookshelfListResponse,
} from '../types/index.js';
import {
  PrivateBookshelfError,
  BookshelfFullError,
} from '../errors/index.js';

export class BookshelfService extends BaseService {
  private readonly MAX_BOOKS_PER_BOOKSHELF = 1000; // Configurable limit

  constructor(repositories: RepositoryContainer) {
    super(repositories);
  }

  /**
   * Creates a new bookshelf
   */
  async createBookshelf(
    bookshelfData: Omit<BookshelfInsert, 'userId'>, 
    userId: number
  ): Promise<Bookshelf> {
    this.validatePositive(userId, 'User ID');
    this.validateNotEmpty(bookshelfData.name, 'name');
    this.validateLength(bookshelfData.name, 1, 100, 'name');

    if (bookshelfData.description) {
      this.validateLength(bookshelfData.description, 0, 500, 'description');
    }

    const fullBookshelfData: BookshelfInsert = {
      ...bookshelfData,
      userId,
      isPublic: bookshelfData.isPublic ?? false,
    };

    return await this.repositories.bookshelfRepository.createBookshelf(fullBookshelfData);
  }

  /**
   * Gets a bookshelf by ID with access control
   */
  async getBookshelfById(id: number, requestingUserId?: number): Promise<Bookshelf> {
    this.validatePositive(id, 'Bookshelf ID');

    const bookshelf = await this.repositories.bookshelfRepository.findById(id);
    this.validateResourceExists(bookshelf, 'Bookshelf', id);

    // Check access permissions
    if (!bookshelf.isPublic && bookshelf.userId !== requestingUserId) {
      throw new PrivateBookshelfError(bookshelf.name);
    }

    return bookshelf;
  }

  /**
   * Gets a bookshelf with its books
   */
  async getBookshelfWithBooks(id: number, requestingUserId?: number): Promise<BookshelfDetailResponse> {
    this.validatePositive(id, 'Bookshelf ID');

    const result = await this.repositories.bookshelfRepository.getBookshelfWithBooks(id);
    this.validateResourceExists(result, 'Bookshelf', id);

    const { bookshelf, books } = result;

    // Check access permissions
    if (!bookshelf.isPublic && bookshelf.userId !== requestingUserId) {
      throw new PrivateBookshelfError(bookshelf.name);
    }

    // Get user details
    const user = await this.repositories.userRepository.findById(bookshelf.userId);
    this.validateResourceExists(user, 'User', bookshelf.userId);

    return {
      ...bookshelf,
      books,
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }

  /**
   * Updates a bookshelf
   */
  async updateBookshelf(
    id: number, 
    updates: BookshelfUpdate, 
    userId: number
  ): Promise<Bookshelf> {
    this.validatePositive(id, 'Bookshelf ID');
    this.validatePositive(userId, 'User ID');

    // Get bookshelf and verify ownership
    const bookshelf = await this.repositories.bookshelfRepository.findById(id);
    this.validateResourceExists(bookshelf, 'Bookshelf', id);
    this.validateOwnership(bookshelf.userId, userId, 'Bookshelf', id);

    // Validate update data
    if (updates.name !== undefined) {
      this.validateNotEmpty(updates.name, 'name');
      this.validateLength(updates.name, 1, 100, 'name');
    }

    if (updates.description !== undefined && updates.description !== null) {
      this.validateLength(updates.description, 0, 500, 'description');
    }

    return await this.repositories.bookshelfRepository.updateBookshelf(id, updates);
  }

  /**
   * Gets user's bookshelves
   */
  async getUserBookshelves(
    userId: number,
    options: {
      isPublic?: boolean;
      page?: number;
      limit?: number;
      sortBy?: 'createdAt' | 'name';
      sortOrder?: 'asc' | 'desc';
    } = {},
    requestingUserId?: number
  ): Promise<BookshelfListResponse> {
    this.validatePositive(userId, 'User ID');

    const { validatedLimit, offset } = this.validatePagination(options.page, options.limit);

    // If requesting user is different from the target user, only show public bookshelves
    const isPublic = userId !== requestingUserId ? true : options.isPublic;

    const repositoryOptions: any = {
      limit: validatedLimit,
      offset,
    };
    
    if (isPublic !== undefined) {
      repositoryOptions.isPublic = isPublic;
    }
    if (options.sortBy !== undefined) {
      repositoryOptions.sortBy = options.sortBy;
    }
    if (options.sortOrder !== undefined) {
      repositoryOptions.sortOrder = options.sortOrder;
    }
    
    const result = await this.repositories.bookshelfRepository.getUserBookshelves(userId, repositoryOptions);

    return {
      bookshelves: result.bookshelves,
      total: result.total,
    };
  }

  /**
   * Gets public bookshelves for discovery
   */
  async getPublicBookshelves(
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'createdAt' | 'name';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<BookshelfListResponse> {
    const { validatedLimit, offset } = this.validatePagination(options.page, options.limit);

    const repositoryOptions: any = {
      limit: validatedLimit,
      offset,
    };
    
    if (options.sortBy !== undefined) {
      repositoryOptions.sortBy = options.sortBy;
    }
    if (options.sortOrder !== undefined) {
      repositoryOptions.sortOrder = options.sortOrder;
    }
    
    const result = await this.repositories.bookshelfRepository.getPublicBookshelves(repositoryOptions);

    return {
      bookshelves: result.bookshelves,
      total: result.total,
    };
  }

  /**
   * Adds a book to a bookshelf
   */
  async addBookToBookshelf(
    bookshelfId: number,
    userBookId: number,
    userId: number,
    displayOrder?: number
  ): Promise<void> {
    this.validatePositive(bookshelfId, 'Bookshelf ID');
    this.validatePositive(userBookId, 'User Book ID');
    this.validatePositive(userId, 'User ID');

    // Get bookshelf and verify ownership
    const bookshelf = await this.repositories.bookshelfRepository.findById(bookshelfId);
    this.validateResourceExists(bookshelf, 'Bookshelf', bookshelfId);
    this.validateOwnership(bookshelf.userId, userId, 'Bookshelf', bookshelfId);

    // Verify user book exists and belongs to user
    const userBook = await this.repositories.bookRepository.findUserBookById(userBookId);
    this.validateResourceExists(userBook, 'UserBook', userBookId);
    this.validateOwnership(userBook.userId, userId, 'UserBook', userBookId);

    // Check bookshelf capacity
    const currentBookCount = await this.repositories.bookshelfRepository.getBookCount(bookshelfId);
    if (currentBookCount >= this.MAX_BOOKS_PER_BOOKSHELF) {
      throw new BookshelfFullError(this.MAX_BOOKS_PER_BOOKSHELF);
    }

    // Validate display order if provided
    if (displayOrder !== undefined) {
      this.validateNonNegative(displayOrder, 'display order');
    }

    await this.repositories.bookshelfRepository.addBookToBookshelf(
      bookshelfId,
      userBookId,
      displayOrder
    );
  }

  /**
   * Removes a book from a bookshelf
   */
  async removeBookFromBookshelf(
    bookshelfId: number,
    userBookId: number,
    userId: number
  ): Promise<void> {
    this.validatePositive(bookshelfId, 'Bookshelf ID');
    this.validatePositive(userBookId, 'User Book ID');
    this.validatePositive(userId, 'User ID');

    // Get bookshelf and verify ownership
    const bookshelf = await this.repositories.bookshelfRepository.findById(bookshelfId);
    this.validateResourceExists(bookshelf, 'Bookshelf', bookshelfId);
    this.validateOwnership(bookshelf.userId, userId, 'Bookshelf', bookshelfId);

    await this.repositories.bookshelfRepository.removeBookFromBookshelf(bookshelfId, userBookId);
  }

  /**
   * Updates book order in a bookshelf
   */
  async updateBookOrder(
    bookshelfId: number,
    userBookId: number,
    newDisplayOrder: number,
    userId: number
  ): Promise<void> {
    this.validatePositive(bookshelfId, 'Bookshelf ID');
    this.validatePositive(userBookId, 'User Book ID');
    this.validateNonNegative(newDisplayOrder, 'display order');
    this.validatePositive(userId, 'User ID');

    // Get bookshelf and verify ownership
    const bookshelf = await this.repositories.bookshelfRepository.findById(bookshelfId);
    this.validateResourceExists(bookshelf, 'Bookshelf', bookshelfId);
    this.validateOwnership(bookshelf.userId, userId, 'Bookshelf', bookshelfId);

    await this.repositories.bookshelfRepository.updateBookOrder(
      bookshelfId,
      userBookId,
      newDisplayOrder
    );
  }

  /**
   * Searches bookshelves
   */
  async searchBookshelves(
    query: string,
    options: {
      isPublicOnly?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<BookshelfListResponse> {
    this.validateNotEmpty(query, 'search query');
    this.validateLength(query, 1, 100, 'search query');

    const { validatedLimit, offset } = this.validatePagination(options.page, options.limit);

    const repositoryOptions: any = {
      limit: validatedLimit,
      offset,
    };
    
    if (options.isPublicOnly !== undefined) {
      repositoryOptions.isPublicOnly = options.isPublicOnly;
    }
    
    const result = await this.repositories.bookshelfRepository.searchBookshelves(query, repositoryOptions);

    return {
      bookshelves: result.bookshelves,
      total: result.total,
    };
  }

  /**
   * Deletes a bookshelf
   */
  async deleteBookshelf(id: number, userId: number): Promise<void> {
    this.validatePositive(id, 'Bookshelf ID');
    this.validatePositive(userId, 'User ID');

    // Get bookshelf and verify ownership
    const bookshelf = await this.repositories.bookshelfRepository.findById(id);
    this.validateResourceExists(bookshelf, 'Bookshelf', id);
    this.validateOwnership(bookshelf.userId, userId, 'Bookshelf', id);

    await this.repositories.bookshelfRepository.deleteBookshelf(id);
  }

  /**
   * Checks if user owns a bookshelf
   */
  async isOwner(bookshelfId: number, userId: number): Promise<boolean> {
    this.validatePositive(bookshelfId, 'Bookshelf ID');
    this.validatePositive(userId, 'User ID');

    return await this.repositories.bookshelfRepository.isOwner(bookshelfId, userId);
  }

  /**
   * Gets the number of books in a bookshelf
   */
  async getBookCount(bookshelfId: number): Promise<number> {
    this.validatePositive(bookshelfId, 'Bookshelf ID');

    return await this.repositories.bookshelfRepository.getBookCount(bookshelfId);
  }
}