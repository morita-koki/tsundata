/**
 * Book Repository
 * Handles all book-related database operations
 */

import { eq, and, or, desc, asc, like, count, inArray } from 'drizzle-orm';
import { books, userBooks } from '../models/index.js';
import { BaseRepository, type Database } from './BaseRepository.js';
import type { 
  Book, 
  BookInsert, 
  BookUpdate,
  UserBook,
  UserBookUpdate
} from '../types/index.js';
import { 
  DuplicateUserBookError 
} from '../errors/index.js';

export class BookRepository extends BaseRepository {
  constructor(db: Database) {
    super(db);
  }

  /**
   * Creates a new book
   */
  async createBook(bookData: BookInsert): Promise<Book> {
    return this.executeOperation(async () => {
      const result = await this.db
        .insert(books)
        .values({
          ...bookData,
          createdAt: new Date(),
        })
        .returning();

      this.validateRecordsExist(result, 'Book');
      return result[0] as Book;
    }, 'create book');
  }

  /**
   * Finds book by ID
   */
  async findById(id: number): Promise<Book | null> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select()
        .from(books)
        .where(eq(books.id, id))
        .limit(1);

      return result[0] || null;
    }, 'find book by ID');
  }

  /**
   * Finds book by ISBN
   */
  async findByIsbn(isbn: string): Promise<Book | null> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select()
        .from(books)
        .where(eq(books.isbn, isbn))
        .limit(1);

      return result[0] || null;
    }, 'find book by ISBN');
  }

  /**
   * Updates book information
   */
  async updateBook(id: number, updates: BookUpdate): Promise<Book> {
    return this.executeOperation(async () => {
      const result = await this.db
        .update(books)
        .set(updates)
        .where(eq(books.id, id))
        .returning();

      this.validateRecordsExist(result, 'Book');
      return result[0] as Book;
    }, 'update book');
  }

  /**
   * Searches books by title, author, or ISBN
   */
  async searchBooks(
    query: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ books: Book[]; total: number }> {
    return this.executeOperation(async () => {
      const { limit = 20, offset = 0 } = options;
      const searchPattern = `%${query}%`;

      // Get matching books
      const bookResults = await this.db
        .select()
        .from(books)
        .where(
          or(
            like(books.title, searchPattern),
            like(books.author, searchPattern),
            like(books.isbn, searchPattern)
          )
        )
        .limit(limit)
        .offset(offset)
        .orderBy(desc(books.createdAt));

      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(books)
        .where(
          or(
            like(books.title, searchPattern),
            like(books.author, searchPattern),
            like(books.isbn, searchPattern)
          )
        );

      return {
        books: bookResults as Book[],
        total: totalResult[0]?.count || 0,
      };
    }, 'search books');
  }

  /**
   * Adds a book to user's library
   */
  async addToUserLibrary(userId: number, bookId: number): Promise<UserBook> {
    return this.executeOperation(async () => {
      // Check if book already exists in user's library
      const existing = await this.db
        .select()
        .from(userBooks)
        .where(
          and(
            eq(userBooks.userId, userId),
            eq(userBooks.bookId, bookId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new DuplicateUserBookError(userId, bookId);
      }

      const result = await this.db
        .insert(userBooks)
        .values({
          userId,
          bookId,
          isRead: false,
          addedAt: new Date(),
        })
        .returning();

      this.validateRecordsExist(result, 'UserBook');
      return result[0] as UserBook;
    }, 'add book to user library');
  }

  /**
   * Removes a book from user's library
   */
  async removeFromUserLibrary(userId: number, bookId: number): Promise<void> {
    return this.executeOperation(async () => {
      const result = await this.db
        .delete(userBooks)
        .where(
          and(
            eq(userBooks.userId, userId),
            eq(userBooks.bookId, bookId)
          )
        )
        .returning({ id: userBooks.id });

      this.validateRecordsExist(result, 'UserBook');
    }, 'remove book from user library');
  }

  /**
   * Updates user book (e.g., mark as read)
   */
  async updateUserBook(userBookId: number, updates: UserBookUpdate): Promise<UserBook> {
    return this.executeOperation(async () => {
      const updateData = { ...updates };
      
      // If marking as read, set readAt timestamp
      if (updates.isRead === true && !updates.readAt) {
        updateData.readAt = new Date();
      } else if (updates.isRead === false) {
        updateData.readAt = null;
      }

      const result = await this.db
        .update(userBooks)
        .set(updateData)
        .where(eq(userBooks.id, userBookId))
        .returning();

      this.validateRecordsExist(result, 'UserBook');
      return result[0] as UserBook;
    }, 'update user book');
  }

  /**
   * Gets user's library with book details
   */
  async getUserLibrary(
    userId: number,
    options: { 
      isRead?: boolean; 
      limit?: number; 
      offset?: number;
      sortBy?: 'addedAt' | 'readAt' | 'title';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ 
    books: Array<UserBook & { book: Book }>; 
    total: number 
  }> {
    return this.executeOperation(async () => {
      const { 
        isRead, 
        limit = 20, 
        offset = 0, 
        sortBy = 'addedAt', 
        sortOrder = 'desc' 
      } = options;

      // Build where conditions
      const whereConditions = [eq(userBooks.userId, userId)];
      if (isRead !== undefined) {
        whereConditions.push(eq(userBooks.isRead, isRead));
      }

      // Build order by
      let orderBy;
      const direction = sortOrder === 'asc' ? asc : desc;
      switch (sortBy) {
        case 'readAt':
          orderBy = direction(userBooks.readAt);
          break;
        case 'title':
          orderBy = direction(books.title);
          break;
        default:
          orderBy = direction(userBooks.addedAt);
      }

      // Get user books with book details
      const userBookResults = await this.db
        .select({
          // UserBook fields
          id: userBooks.id,
          userId: userBooks.userId,
          bookId: userBooks.bookId,
          isRead: userBooks.isRead,
          addedAt: userBooks.addedAt,
          readAt: userBooks.readAt,
          // Book fields
          book: {
            id: books.id,
            isbn: books.isbn,
            title: books.title,
            author: books.author,
            publisher: books.publisher,
            publishedDate: books.publishedDate,
            description: books.description,
            pageCount: books.pageCount,
            thumbnail: books.thumbnail,
            price: books.price,
            series: books.series,
            createdAt: books.createdAt,
          },
        })
        .from(userBooks)
        .innerJoin(books, eq(userBooks.bookId, books.id))
        .where(and(...whereConditions))
        .limit(limit)
        .offset(offset)
        .orderBy(orderBy);

      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(userBooks)
        .where(and(...whereConditions));

      return {
        books: userBookResults as Array<UserBook & { book: Book }>,
        total: totalResult[0]?.count || 0,
      };
    }, 'get user library');
  }

  /**
   * Finds user book by ID
   */
  async findUserBookById(userBookId: number): Promise<UserBook | null> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select()
        .from(userBooks)
        .where(eq(userBooks.id, userBookId))
        .limit(1);

      return (result[0] as UserBook) || null;
    }, 'find user book by ID');
  }

  /**
   * Finds user book by user ID and book ID
   */
  async findUserBook(userId: number, bookId: number): Promise<UserBook | null> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select()
        .from(userBooks)
        .where(
          and(
            eq(userBooks.userId, userId),
            eq(userBooks.bookId, bookId)
          )
        )
        .limit(1);

      return (result[0] as UserBook) || null;
    }, 'find user book');
  }

  /**
   * Gets books by IDs
   */
  async findBooksByIds(bookIds: number[]): Promise<Book[]> {
    return this.executeOperation(async () => {
      if (bookIds.length === 0) {
        return [];
      }

      const result = await this.db
        .select()
        .from(books)
        .where(inArray(books.id, bookIds));

      return result as Book[];
    }, 'find books by IDs');
  }

  /**
   * Gets user books by IDs
   */
  async findUserBooksByIds(userBookIds: number[]): Promise<UserBook[]> {
    return this.executeOperation(async () => {
      if (userBookIds.length === 0) {
        return [];
      }

      const result = await this.db
        .select()
        .from(userBooks)
        .where(inArray(userBooks.id, userBookIds));

      return result as UserBook[];
    }, 'find user books by IDs');
  }

  /**
   * Deletes a book (only if not referenced by any user books)
   */
  async deleteBook(id: number): Promise<void> {
    return this.executeOperation(async () => {
      // Check if book is referenced by any user books
      const userBookCount = await this.db
        .select({ count: count() })
        .from(userBooks)
        .where(eq(userBooks.bookId, id));

      if ((userBookCount[0]?.count ?? 0) > 0) {
        throw new Error('Cannot delete book that is in user libraries');
      }

      const result = await this.db
        .delete(books)
        .where(eq(books.id, id))
        .returning({ id: books.id });

      this.validateRecordsExist(result, 'Book');
    }, 'delete book');
  }
}