/**
 * API Request and Response types
 */

import type { User, Book, UserBook, Bookshelf } from './database.js';

// Common API response structure
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  code?: string;
  details?: any;
}

// Authentication
export interface AuthSyncRequest {
  // Firebase ID token is passed via Authorization header
}

export interface AuthSyncResponse {
  user: Omit<User, 'createdAt' | 'updatedAt'>;
  firebaseUser: {
    uid: string;
    email: string;
    name?: string | undefined;
  };
}

// Books
export interface BookSearchResponse extends Book {}

export interface BookAddRequest {
  isbn: string;
}

export interface BookAddResponse extends UserBook {
  book: Book;
}

export interface UserBooksResponse {
  books: Array<UserBook & { book: Book }>;
  total: number;
}

export interface BookReadStatusRequest {
  isRead: boolean;
}

// Bookshelves
export interface BookshelfCreateRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface BookshelfCreateResponse extends Bookshelf {}

export interface BookshelfUpdateRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface BookshelfListResponse {
  bookshelves: Bookshelf[];
  total: number;
}

export interface BookshelfDetailResponse extends Bookshelf {
  books: Array<{
    id: number;
    userBookId: number;
    addedAt: Date;
    displayOrder: number;
    book: Book;
    isRead: boolean;
  }>;
  user: Pick<User, 'id' | 'username'>;
}

export interface BookshelfAddBookRequest {
  userBookId: number;
  displayOrder?: number;
}

// Users
export interface UserStatsResponse {
  totalBooks: number;
  readBooks: number;
  unreadBooks: number;
  totalBookshelves: number;
  publicBookshelves: number;
  followers: number;
  following: number;
}

export interface UserSearchRequest {
  query: string;
  limit?: number;
  offset?: number;
}

export interface UserSearchResponse {
  users: Array<Pick<User, 'id' | 'username' | 'email'>>;
  total: number;
}

export interface FollowUserRequest {
  userId: number;
}

export interface BlockUserRequest {
  userId: number;
}

// External API types (Book Search)
export interface ExternalBookData {
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  thumbnail?: string;
  price?: number;
  series?: string;
}

// Pagination
export interface PaginationRequest {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Query parameters
export interface BookshelfQueryParams extends PaginationRequest {
  isPublic?: boolean;
  userId?: number;
}

export interface UserBooksQueryParams extends PaginationRequest {
  isRead?: boolean;
  bookshelfId?: number;
}