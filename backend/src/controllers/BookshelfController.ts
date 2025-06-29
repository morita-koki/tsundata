/**
 * Bookshelf Controller
 * Handles bookshelf-related operations
 */

import type { Response, NextFunction } from 'express';
import { BaseController } from './BaseController.js';
import type { ServiceContainer } from '../services/index.js';
import type { AuthRequest } from '../types/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export class BookshelfController extends BaseController {
  constructor(services: ServiceContainer) {
    super(services);
  }

  /**
   * POST /api/bookshelves
   * Creates a new bookshelf
   */
  createBookshelf = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    this.validateRequestBody(req.body);
    this.validateRequiredFields(req.body, ['name']);

    const { name, description, isPublic } = req.body as { name: string; description?: string; isPublic?: boolean; };
    
    const bookshelfData: Parameters<typeof this.services.bookshelfService.createBookshelf>[0] = {
      name,
      isPublic: isPublic ?? false
    };
    if (description !== undefined) bookshelfData.description = description;

    const bookshelf = await this.services.bookshelfService.createBookshelf(
      bookshelfData,
      userId
    );
    
    this.sendCreated(res, bookshelf);
  });

  /**
   * GET /api/bookshelves/:id
   * Gets a bookshelf by ID
   */
  getBookshelfById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const bookshelfId = this.getIdParam(req, 'id');
    const userId = this.getUserId(req);
    
    const bookshelf = await this.services.bookshelfService.getBookshelfById(bookshelfId, userId);
    
    this.sendSuccess(res, bookshelf);
  });

  /**
   * GET /api/bookshelves/:id/books
   * Gets a bookshelf with its books
   */
  getBookshelfWithBooks = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const bookshelfId = this.getIdParam(req, 'id');
    const userId = this.getUserId(req);
    
    const bookshelfDetail = await this.services.bookshelfService.getBookshelfWithBooks(
      bookshelfId,
      userId
    );
    
    this.sendSuccess(res, bookshelfDetail);
  });

  /**
   * PUT /api/bookshelves/:id
   * Updates a bookshelf
   */
  updateBookshelf = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const bookshelfId = this.getIdParam(req, 'id');
    const userId = this.getUserId(req);
    this.validateRequestBody(req.body);

    const { name, description, isPublic } = req.body as { name?: string; description?: string; isPublic?: boolean; };
    const updates: any = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isPublic !== undefined) updates.isPublic = isPublic;

    const updatedBookshelf = await this.services.bookshelfService.updateBookshelf(
      bookshelfId,
      updates,
      userId
    );
    
    this.sendSuccess(res, updatedBookshelf);
  });

  /**
   * DELETE /api/bookshelves/:id
   * Deletes a bookshelf
   */
  deleteBookshelf = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const bookshelfId = this.getIdParam(req, 'id');
    const userId = this.getUserId(req);
    
    await this.services.bookshelfService.deleteBookshelf(bookshelfId, userId);
    
    this.sendNoContent(res);
  });

  /**
   * GET /api/bookshelves
   * Gets bookshelves (user's own or public)
   */
  getBookshelves = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const userId = this.getUserId(req);
    const { page, limit } = this.getPaginationParams(req);
    
    const targetUserId = this.getOptionalNumberQuery(req, 'userId') || userId;
    const isPublic = this.getOptionalBooleanQuery(req, 'isPublic');
    const sortBy = this.getOptionalStringQuery(req, 'sortBy') as 'createdAt' | 'name' | undefined;
    const sortOrder = this.getOptionalStringQuery(req, 'sortOrder') as 'asc' | 'desc' | undefined;

    const options: Parameters<typeof this.services.bookshelfService.getUserBookshelves>[1] = {
      page,
      limit,
    };
    if (isPublic !== undefined) options.isPublic = isPublic;
    if (sortBy !== undefined) options.sortBy = sortBy;
    if (sortOrder !== undefined) options.sortOrder = sortOrder;

    const result = await this.services.bookshelfService.getUserBookshelves(
      targetUserId,
      options,
      userId
    );

    this.sendPaginated(res, result.bookshelves, result.total, page, limit);
  });

  /**
   * GET /api/bookshelves/public
   * Gets public bookshelves for discovery
   */
  getPublicBookshelves = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { page, limit } = this.getPaginationParams(req);
    const sortBy = this.getOptionalStringQuery(req, 'sortBy') as 'createdAt' | 'name' | undefined;
    const sortOrder = this.getOptionalStringQuery(req, 'sortOrder') as 'asc' | 'desc' | undefined;

    const options: Parameters<typeof this.services.bookshelfService.getPublicBookshelves>[0] = {
      page,
      limit,
    };
    if (sortBy !== undefined) options.sortBy = sortBy;
    if (sortOrder !== undefined) options.sortOrder = sortOrder;

    const result = await this.services.bookshelfService.getPublicBookshelves(options);

    this.sendPaginated(res, result.bookshelves, result.total, page, limit);
  });

  /**
   * POST /api/bookshelves/:id/books
   * Adds a book to a bookshelf
   */
  addBookToBookshelf = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const bookshelfId = this.getIdParam(req, 'id');
    const userId = this.getUserId(req);
    this.validateRequestBody(req.body);
    this.validateRequiredFields(req.body, ['userBookId']);

    const { userBookId, displayOrder } = req.body as { userBookId: number; displayOrder?: number; };
    
    await this.services.bookshelfService.addBookToBookshelf(
      bookshelfId,
      userBookId,
      userId,
      displayOrder
    );
    
    this.sendNoContent(res);
  });

  /**
   * DELETE /api/bookshelves/:id/books/:userBookId
   * Removes a book from a bookshelf
   */
  removeBookFromBookshelf = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const bookshelfId = this.getIdParam(req, 'id');
    const userBookId = this.getIdParam(req, 'userBookId');
    const userId = this.getUserId(req);
    
    await this.services.bookshelfService.removeBookFromBookshelf(
      bookshelfId,
      userBookId,
      userId
    );
    
    this.sendNoContent(res);
  });

  /**
   * PUT /api/bookshelves/:id/books/:userBookId/order
   * Updates book order in bookshelf
   */
  updateBookOrder = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const bookshelfId = this.getIdParam(req, 'id');
    const userBookId = this.getIdParam(req, 'userBookId');
    const userId = this.getUserId(req);
    this.validateRequestBody(req.body);
    this.validateRequiredFields(req.body, ['displayOrder']);

    const { displayOrder } = req.body as { displayOrder: number; };
    
    await this.services.bookshelfService.updateBookOrder(
      bookshelfId,
      userBookId,
      displayOrder,
      userId
    );
    
    this.sendNoContent(res);
  });

  /**
   * GET /api/bookshelves/search
   * Searches bookshelves
   */
  searchBookshelves = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const query = this.getOptionalStringQuery(req, 'q');
    if (!query) {
      throw new Error('Search query parameter "q" is required');
    }

    const { page, limit } = this.getPaginationParams(req);
    const isPublicOnly = this.getOptionalBooleanQuery(req, 'isPublicOnly') ?? true;
    
    const result = await this.services.bookshelfService.searchBookshelves(query, {
      isPublicOnly,
      page,
      limit,
    });
    
    this.sendPaginated(res, result.bookshelves, result.total, page, limit);
  });
}