/**
 * Book Controller
 * Handles book-related operations
 */

import type { Response, NextFunction } from 'express';
import { BaseController } from './BaseController.js';
import type { ServiceContainer } from '../services/index.js';
import type { AuthRequest } from '../types/auth.js';
import type { 
  BookAddToLibraryData,
  BookReadingStatusData,
  BookLibraryQuery,
  BookSearchQuery
} from '../validation/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export class BookController extends BaseController {
  constructor(services: ServiceContainer) {
    super(services);
  }

  /**
   * GET /api/books/search/:isbn
   * Searches for a book by ISBN
   */
  searchByISBN = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { isbn } = (req as any).validatedParams as { isbn: string };
    
    const book = await this.services.bookService.searchBookByISBN(isbn);
    
    this.sendSuccess(res, book);
  });

  /**
   * POST /api/books/library
   * Adds a book to user's library
   */
  addToLibrary = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    const { isbn } = (req as any).validatedBody as BookAddToLibraryData;
    
    const result = await this.services.bookService.addBookToLibrary(isbn, userId);
    
    this.sendCreated(res, result);
  });

  /**
   * DELETE /api/books/library/:isbn
   * Removes a book from user's library
   */
  removeFromLibrary = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    const { isbn } = (req as any).validatedParams as { isbn: string };
    
    await this.services.bookService.removeBookFromLibrary(isbn, userId);
    
    this.sendNoContent(res);
  });

  /**
   * GET /api/books/library
   * Gets user's book library
   */
  getLibrary = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    const { page, limit, isRead, sortBy, sortOrder } = (req as any).validatedQuery as BookLibraryQuery;

    const options: Parameters<typeof this.services.bookService.getUserLibrary>[1] = {
      page,
      limit,
    };
    if (isRead !== undefined) options.isRead = isRead;
    if (sortBy !== undefined) options.sortBy = sortBy;
    if (sortOrder !== undefined) options.sortOrder = sortOrder;

    const result = await this.services.bookService.getUserLibrary(userId, options);

    this.sendPaginated(res, result.books, result.total, page, limit);
  });

  /**
   * PUT /api/books/library/:userBookId/status
   * Updates reading status of a book
   */
  updateReadingStatus = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    const { userBookId } = (req as any).validatedParams as { userBookId: number };
    const { isRead } = (req as any).validatedBody as BookReadingStatusData;
    
    const updatedUserBook = await this.services.bookService.updateReadingStatus(
      userBookId,
      isRead,
      userId
    );
    
    this.sendSuccess(res, updatedUserBook);
  });

  /**
   * GET /api/books/library/:userBookId
   * Gets details of a specific user book
   */
  getUserBook = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    const { userBookId } = (req as any).validatedParams as { userBookId: number };
    
    const userBook = await this.services.bookService.getUserBook(userBookId, userId);
    
    this.sendSuccess(res, userBook);
  });

  /**
   * GET /api/books/search
   * Searches books in the database
   */
  searchBooks = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { q: query, page, limit } = (req as any).validatedQuery as BookSearchQuery;
    
    const result = await this.services.bookService.searchBooks(query, { page, limit });
    
    this.sendPaginated(res, result.books, result.total, page, limit);
  });

  /**
   * GET /api/books/:id
   * Gets a book by ID
   */
  getBookById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { id: bookId } = (req as any).validatedParams as { id: number };
    
    const book = await this.services.bookService.getBookById(bookId);
    
    this.sendSuccess(res, book);
  });
}