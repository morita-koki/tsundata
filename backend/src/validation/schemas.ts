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

export const ISBNSchema = z.string()
  .min(10, 'ISBN must be at least 10 digits')
  .max(17, 'ISBN must be at most 17 characters')
  .regex(/^[\d-]+$/, 'ISBN must contain only digits and hyphens');

// Authentication schemas
export const AuthProfileUpdateSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username must be less than 50 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
});

// Book schemas
export const BookAddToLibrarySchema = z.object({
  isbn: ISBNSchema,
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