/**
 * Book Controller
 * Handles book-related operations
 */

import type { Response, NextFunction } from 'express';
import { BaseController } from './BaseController.js';
import type { ServiceContainer } from '../services/index.js';
import type { AuthRequest } from '../types/auth.js';
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
    const isbn = this.getStringParam(req, 'isbn');
    
    const book = await this.services.bookService.searchBookByISBN(isbn);
    
    this.sendSuccess(res, book);
  });

  /**
   * POST /api/books/library
   * Adds a book to user's library
   */
  addToLibrary = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    this.validateRequestBody(req.body);
    this.validateRequiredFields(req.body, ['isbn']);

    const { isbn } = req.body as { isbn: string; };
    
    const result = await this.services.bookService.addBookToLibrary(isbn, userId);
    
    this.sendCreated(res, result);
  });

  /**
   * DELETE /api/books/library/:isbn
   * Removes a book from user's library
   */
  removeFromLibrary = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    const isbn = this.getStringParam(req, 'isbn');
    
    await this.services.bookService.removeBookFromLibrary(isbn, userId);
    
    this.sendNoContent(res);
  });

  /**
   * GET /api/books/library
   * Gets user's book library
   */
  getLibrary = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    const { page, limit } = this.getPaginationParams(req);
    
    const isRead = this.getOptionalBooleanQuery(req, 'isRead');
    const sortBy = this.getOptionalStringQuery(req, 'sortBy') as 'addedAt' | 'readAt' | 'title' | undefined;
    const sortOrder = this.getOptionalStringQuery(req, 'sortOrder') as 'asc' | 'desc' | undefined;

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
    const userBookId = this.getIdParam(req, 'userBookId');
    this.validateRequestBody(req.body);
    this.validateRequiredFields(req.body, ['isRead']);

    const { isRead } = req.body as { isRead: boolean; };
    
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
    const userBookId = this.getIdParam(req, 'userBookId');
    
    const userBook = await this.services.bookService.getUserBook(userBookId, userId);
    
    this.sendSuccess(res, userBook);
  });

  /**
   * GET /api/books/search
   * Searches books in the database
   */
  searchBooks = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const query = this.getOptionalStringQuery(req, 'q');
    if (!query) {
      throw new Error('Search query parameter "q" is required');
    }

    const { page, limit } = this.getPaginationParams(req);
    
    const result = await this.services.bookService.searchBooks(query, { page, limit });
    
    this.sendPaginated(res, result.books, result.total, page, limit);
  });

  /**
   * GET /api/books/:id
   * Gets a book by ID
   */
  getBookById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const bookId = this.getIdParam(req, 'id');
    
    const book = await this.services.bookService.getBookById(bookId);
    
    this.sendSuccess(res, book);
  });
}