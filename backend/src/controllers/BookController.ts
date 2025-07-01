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

  /**
   * POST /api/books/barcode/search
   * Searches for a book using barcode scanner input
   */
  searchByBarcode = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { barcode } = (req as any).validatedBody as { barcode: string };
    
    // Extract ISBN from barcode
    const isbnInfo = this.services.isbnService.extractISBNFromBarcode(barcode);
    
    if (!isbnInfo || !isbnInfo.isValid) {
      this.sendNotFound(res, 'Invalid barcode or not an ISBN barcode');
      return;
    }
    
    // Search for the book using the extracted ISBN
    const book = await this.services.bookService.searchBookByISBN(isbnInfo.isbn13 || isbnInfo.isbn10!);
    
    this.sendSuccess(res, {
      book,
      isbnInfo: {
        original: barcode,
        extractedISBN: isbnInfo.isbn13 || isbnInfo.isbn10,
        format: isbnInfo.format,
        region: isbnInfo.region,
        language: isbnInfo.language
      }
    });
  });

  /**
   * POST /api/books/isbn/analyze
   * Analyzes ISBN and returns detailed information
   */
  analyzeISBN = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { isbn } = (req as any).validatedBody as { isbn: string };
    
    const analysis = this.services.isbnService.analyzeISBN(isbn);
    
    this.sendSuccess(res, analysis);
  });

  /**
   * POST /api/books/isbn/convert
   * Converts ISBN between formats
   */
  convertISBN = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { isbn, targetFormat } = (req as any).validatedBody as { isbn: string; targetFormat?: 'ISBN-10' | 'ISBN-13' };
    
    const analysis = this.services.isbnService.analyzeISBN(isbn);
    
    if (!analysis.isValid) {
      this.sendBadRequest(res, 'Invalid ISBN provided');
      return;
    }
    
    let converted: string | null = null;
    
    if (!targetFormat) {
      // Auto-convert to the opposite format
      if (analysis.format === 'ISBN-10' && analysis.isbn13) {
        converted = analysis.isbn13;
      } else if (analysis.format === 'ISBN-13' && analysis.isbn10) {
        converted = analysis.isbn10;
      }
    } else if (targetFormat === 'ISBN-13') {
      converted = analysis.isbn13;
    } else if (targetFormat === 'ISBN-10') {
      converted = analysis.isbn10;
    }
    
    if (!converted) {
      this.sendBadRequest(res, `Cannot convert to ${targetFormat || 'target format'}`);
      return;
    }
    
    this.sendSuccess(res, {
      original: {
        isbn: analysis.original,
        format: analysis.format
      },
      converted: {
        isbn: converted,
        format: targetFormat || (converted.length === 10 ? 'ISBN-10' : 'ISBN-13')
      },
      region: analysis.region,
      language: analysis.language
    });
  });

  /**
   * POST /api/books/isbn/batch-validate
   * Validates multiple ISBNs at once
   */
  batchValidateISBN = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { isbns } = (req as any).validatedBody as { isbns: string[] };
    
    const results = await this.services.isbnService.validateISBNBatch(isbns);
    
    const detailedResults = isbns.map(isbn => {
      const analysis = this.services.isbnService.analyzeISBN(isbn);
      return {
        isbn: isbn,
        isValid: analysis.isValid,
        format: analysis.isValid ? analysis.format : null,
        region: analysis.region,
        errors: analysis.errors
      };
    });
    
    this.sendSuccess(res, {
      summary: {
        total: isbns.length,
        valid: results.valid.length,
        invalid: results.invalid.length,
        validPercentage: Math.round((results.valid.length / isbns.length) * 100)
      },
      results: detailedResults
    });
  });
}