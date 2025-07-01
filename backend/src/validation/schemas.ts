/**
 * Validation Schemas
 * Zod schemas for API endpoint validation
 */

import { z } from 'zod';

// Common validation patterns
export const IdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a positive integer').transform(Number),
});

export const UserBookIdParamSchema = z.object({
  userBookId: z.string().regex(/^\d+$/, 'User book ID must be a positive integer').transform(Number),
});

export const PaginationQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val) || 1) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(100, Math.max(1, parseInt(val) || 20)) : 20),
});

// Enhanced ISBN validation schema
export const ISBNSchema = z.string()
  .min(1, 'ISBN is required')
  .max(20, 'ISBN is too long')
  .transform((val) => val.trim().replace(/[-\s]/g, '')) // Clean the ISBN
  .refine((val) => {
    // Basic format check
    if (val.length !== 10 && val.length !== 13) {
      return false;
    }
    
    // Character validation
    if (val.length === 10) {
      return /^\d{9}[\dX]$/i.test(val);
    } else {
      return /^\d{13}$/.test(val);
    }
  }, {
    message: 'Invalid ISBN format. Must be a valid 10 or 13 digit ISBN.',
  })
  .refine((val) => {
    // Checksum validation for ISBN-10
    if (val.length === 10) {
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        const char = val[i];
        if (!char || !/\d/.test(char)) return false;
        sum += parseInt(char, 10) * (10 - i);
      }
      const lastChar = val[9];
      if (!lastChar) return false;
      const checkDigit = lastChar.toUpperCase() === 'X' ? 10 : parseInt(lastChar, 10);
      if (isNaN(checkDigit)) return false;
      return (sum + checkDigit) % 11 === 0;
    }
    
    // Checksum validation for ISBN-13
    if (val.length === 13) {
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        const char = val[i];
        if (!char || !/\d/.test(char)) return false;
        const digit = parseInt(char, 10);
        sum += i % 2 === 0 ? digit : digit * 3;
      }
      const lastChar = val[12];
      if (!lastChar || !/\d/.test(lastChar)) return false;
      const checkDigit = parseInt(lastChar, 10);
      return (sum + checkDigit) % 10 === 0;
    }
    
    return false;
  }, {
    message: 'Invalid ISBN checksum. Please verify the ISBN is correct.',
  });

// Barcode schema for barcode scanner input
export const BarcodeSchema = z.string()
  .min(13, 'Barcode must be at least 13 digits')
  .max(13, 'Barcode must be exactly 13 digits')
  .regex(/^\d{13}$/, 'Barcode must contain only digits')
  .refine((val) => {
    // Must start with 978 or 979 for ISBN barcodes
    return val.startsWith('978') || val.startsWith('979');
  }, {
    message: 'Barcode must be a valid ISBN barcode (starting with 978 or 979)',
  });

// Authentication schemas
export const AuthProfileUpdateSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username must be less than 50 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
});

// Book schemas
export const BookAddToLibrarySchema = z.object({
  isbn: ISBNSchema,
});

// Enhanced book schemas with barcode support
export const BookBarcodeSearchSchema = z.object({
  barcode: BarcodeSchema,
});

export const ISBNAnalysisSchema = z.object({
  isbn: z.string().min(1, 'ISBN is required'), // Less strict for analysis
});

export const ISBNConversionSchema = z.object({
  isbn: ISBNSchema,
  targetFormat: z.enum(['ISBN-10', 'ISBN-13']).optional(),
});

export const ISBNBatchValidationSchema = z.object({
  isbns: z.array(z.string().min(1)).min(1, 'At least one ISBN is required').max(100, 'Maximum 100 ISBNs allowed'),
});

export const BookReadingStatusSchema = z.object({
  isRead: z.boolean(),
});

export const BookSearchQuerySchema = PaginationQuerySchema.extend({
  q: z.string().min(1, 'Search query is required'),
});

export const BookLibraryQuerySchema = PaginationQuerySchema.extend({
  isRead: z.string().optional().transform(val => {
    if (val === undefined) return undefined;
    return val.toLowerCase() === 'true';
  }),
  sortBy: z.enum(['addedAt', 'readAt', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// User schemas
export const UserSearchQuerySchema = PaginationQuerySchema.extend({
  q: z.string().min(1, 'Search query is required'),
});

// Bookshelf schemas
export const BookshelfCreateSchema = z.object({
  name: z.string().min(1, 'Bookshelf name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isPublic: z.boolean().optional().default(false),
});

export const BookshelfUpdateSchema = z.object({
  name: z.string().min(1, 'Bookshelf name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isPublic: z.boolean().optional(),
});

export const BookshelfAddBookSchema = z.object({
  userBookId: z.number().int().positive('User book ID must be a positive integer'),
  displayOrder: z.number().int().min(0, 'Display order must be non-negative').optional(),
});

export const BookshelfUpdateOrderSchema = z.object({
  displayOrder: z.number().int().min(0, 'Display order must be non-negative'),
});

export const BookshelfQuerySchema = PaginationQuerySchema.extend({
  userId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  isPublic: z.string().optional().transform(val => {
    if (val === undefined) return undefined;
    return val.toLowerCase() === 'true';
  }),
  sortBy: z.enum(['createdAt', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const BookshelfSearchQuerySchema = PaginationQuerySchema.extend({
  q: z.string().min(1, 'Search query is required'),
  isPublicOnly: z.string().optional().transform(val => {
    if (val === undefined) return true;
    return val.toLowerCase() === 'true';
  }),
});

// Combined schemas for specific endpoints
export const Schemas = {
  // Auth endpoints
  auth: {
    updateProfile: {
      body: AuthProfileUpdateSchema,
    },
  },

  // Book endpoints
  books: {
    searchByISBN: {
      params: z.object({
        isbn: ISBNSchema,
      }),
    },
    addToLibrary: {
      body: BookAddToLibrarySchema,
    },
    updateReadingStatus: {
      params: UserBookIdParamSchema,
      body: BookReadingStatusSchema,
    },
    getLibrary: {
      query: BookLibraryQuerySchema,
    },
    search: {
      query: BookSearchQuerySchema,
    },
    getUserBook: {
      params: UserBookIdParamSchema,
    },
    removeFromLibrary: {
      params: z.object({
        isbn: ISBNSchema,
      }),
    },
    getById: {
      params: IdParamSchema,
    },
    // Enhanced ISBN functionality
    searchByBarcode: {
      body: BookBarcodeSearchSchema,
    },
    analyzeISBN: {
      body: ISBNAnalysisSchema,
    },
    convertISBN: {
      body: ISBNConversionSchema,
    },
    batchValidateISBN: {
      body: ISBNBatchValidationSchema,
    },
  },

  // User endpoints
  users: {
    search: {
      query: UserSearchQuerySchema,
    },
    getById: {
      params: IdParamSchema,
    },
    getStats: {
      params: IdParamSchema,
    },
    follow: {
      params: IdParamSchema,
    },
    unfollow: {
      params: IdParamSchema,
    },
    block: {
      params: IdParamSchema,
    },
    unblock: {
      params: IdParamSchema,
    },
    getFollowingStatus: {
      params: IdParamSchema,
    },
  },

  // Bookshelf endpoints
  bookshelves: {
    create: {
      body: BookshelfCreateSchema,
    },
    getById: {
      params: IdParamSchema,
    },
    getWithBooks: {
      params: IdParamSchema,
    },
    update: {
      params: IdParamSchema,
      body: BookshelfUpdateSchema,
    },
    delete: {
      params: IdParamSchema,
    },
    getBookshelves: {
      query: BookshelfQuerySchema,
    },
    getPublic: {
      query: PaginationQuerySchema.extend({
        sortBy: z.enum(['createdAt', 'name']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      }),
    },
    addBook: {
      params: IdParamSchema,
      body: BookshelfAddBookSchema,
    },
    removeBook: {
      params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
        userBookId: z.string().regex(/^\d+$/).transform(Number),
      }),
    },
    updateBookOrder: {
      params: z.object({
        id: z.string().regex(/^\d+$/).transform(Number),
        userBookId: z.string().regex(/^\d+$/).transform(Number),
      }),
      body: BookshelfUpdateOrderSchema,
    },
    search: {
      query: BookshelfSearchQuerySchema,
    },
  },
} as const;

// Export inferred types
export type AuthProfileUpdateData = z.infer<typeof AuthProfileUpdateSchema>;
export type BookAddToLibraryData = z.infer<typeof BookAddToLibrarySchema>;
export type BookReadingStatusData = z.infer<typeof BookReadingStatusSchema>;
export type BookshelfCreateData = z.infer<typeof BookshelfCreateSchema>;
export type BookshelfUpdateData = z.infer<typeof BookshelfUpdateSchema>;
export type BookshelfAddBookData = z.infer<typeof BookshelfAddBookSchema>;
export type BookshelfUpdateOrderData = z.infer<typeof BookshelfUpdateOrderSchema>;

// Query type exports
export type BookLibraryQuery = z.infer<typeof BookLibraryQuerySchema>;
export type BookSearchQuery = z.infer<typeof BookSearchQuerySchema>;
export type UserSearchQuery = z.infer<typeof UserSearchQuerySchema>;
export type BookshelfQuery = z.infer<typeof BookshelfQuerySchema>;
export type BookshelfSearchQuery = z.infer<typeof BookshelfSearchQuerySchema>;