/**
 * Bookshelf Repository
 * Handles all bookshelf-related database operations
 */

import { eq, and, desc, asc, like, count } from 'drizzle-orm';
import { bookshelves, bookshelfBooks, userBooks, books } from '../models/index.js';
import { BaseRepository, type Database } from './BaseRepository.js';
import type { 
  Bookshelf, 
  BookshelfInsert, 
  BookshelfUpdate,
  BookshelfBook,
  Book
} from '../types/index.js';
import { 
  BookshelfBookAlreadyExistsError 
} from '../errors/index.js';

export class BookshelfRepository extends BaseRepository {
  constructor(db: Database) {
    super(db);
  }

  /**
   * Creates a new bookshelf
   */
  async createBookshelf(bookshelfData: BookshelfInsert): Promise<Bookshelf> {
    return this.executeOperation(async () => {
      const result = await this.db
        .insert(bookshelves)
        .values({
          ...bookshelfData,
          createdAt: new Date(),
        })
        .returning();

      this.validateRecordsExist(result, 'Bookshelf');
      return result[0] as Bookshelf;
    }, 'create bookshelf');
  }

  /**
   * Finds bookshelf by ID
   */
  async findById(id: number): Promise<Bookshelf | null> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select()
        .from(bookshelves)
        .where(eq(bookshelves.id, id))
        .limit(1);

      return (result[0] as Bookshelf) || null;
    }, 'find bookshelf by ID');
  }

  /**
   * Updates bookshelf information
   */
  async updateBookshelf(id: number, updates: BookshelfUpdate): Promise<Bookshelf> {
    return this.executeOperation(async () => {
      const result = await this.db
        .update(bookshelves)
        .set(updates)
        .where(eq(bookshelves.id, id))
        .returning();

      this.validateRecordsExist(result, 'Bookshelf');
      return result[0] as Bookshelf;
    }, 'update bookshelf');
  }

  /**
   * Gets user's bookshelves
   */
  async getUserBookshelves(
    userId: number,
    options: { 
      isPublic?: boolean; 
      limit?: number; 
      offset?: number;
      sortBy?: 'createdAt' | 'name';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ bookshelves: Bookshelf[]; total: number }> {
    return this.executeOperation(async () => {
      const { 
        isPublic, 
        limit = 20, 
        offset = 0, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = options;

      // Build where conditions
      const whereConditions = [eq(bookshelves.userId, userId)];
      if (isPublic !== undefined) {
        whereConditions.push(eq(bookshelves.isPublic, isPublic));
      }

      // Build order by
      const direction = sortOrder === 'asc' ? asc : desc;
      const orderBy = sortBy === 'name' ? direction(bookshelves.name) : direction(bookshelves.createdAt);

      // Get bookshelves
      const bookshelfResults = await this.db
        .select()
        .from(bookshelves)
        .where(and(...whereConditions))
        .limit(limit)
        .offset(offset)
        .orderBy(orderBy);

      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(bookshelves)
        .where(and(...whereConditions));

      return {
        bookshelves: bookshelfResults as Bookshelf[],
        total: totalResult[0]?.count || 0,
      };
    }, 'get user bookshelves');
  }

  /**
   * Gets public bookshelves (for discovery)
   */
  async getPublicBookshelves(
    options: { 
      limit?: number; 
      offset?: number;
      sortBy?: 'createdAt' | 'name';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ bookshelves: Bookshelf[]; total: number }> {
    return this.executeOperation(async () => {
      const { 
        limit = 20, 
        offset = 0, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = options;

      // Build order by
      const direction = sortOrder === 'asc' ? asc : desc;
      const orderBy = sortBy === 'name' ? direction(bookshelves.name) : direction(bookshelves.createdAt);

      // Get public bookshelves
      const bookshelfResults = await this.db
        .select()
        .from(bookshelves)
        .where(eq(bookshelves.isPublic, true))
        .limit(limit)
        .offset(offset)
        .orderBy(orderBy);

      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(bookshelves)
        .where(eq(bookshelves.isPublic, true));

      return {
        bookshelves: bookshelfResults as Bookshelf[],
        total: totalResult[0]?.count || 0,
      };
    }, 'get public bookshelves');
  }

  /**
   * Adds a book to a bookshelf
   */
  async addBookToBookshelf(
    bookshelfId: number, 
    userBookId: number, 
    displayOrder?: number
  ): Promise<BookshelfBook> {
    return this.executeOperation(async () => {
      // Check if book is already in the bookshelf
      const existing = await this.db
        .select()
        .from(bookshelfBooks)
        .where(
          and(
            eq(bookshelfBooks.bookshelfId, bookshelfId),
            eq(bookshelfBooks.userBookId, userBookId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new BookshelfBookAlreadyExistsError(bookshelfId, userBookId);
      }

      // If no display order specified, add to the end
      let finalDisplayOrder = displayOrder;
      if (finalDisplayOrder === undefined) {
        const maxOrderResult = await this.db
          .select({ count: count() })
          .from(bookshelfBooks)
          .where(eq(bookshelfBooks.bookshelfId, bookshelfId));
        
        finalDisplayOrder = maxOrderResult[0]?.count || 0;
      }

      const result = await this.db
        .insert(bookshelfBooks)
        .values({
          bookshelfId,
          userBookId,
          addedAt: new Date(),
          displayOrder: finalDisplayOrder,
        })
        .returning();

      this.validateRecordsExist(result, 'BookshelfBook');
      return result[0] as BookshelfBook;
    }, 'add book to bookshelf');
  }

  /**
   * Removes a book from a bookshelf
   */
  async removeBookFromBookshelf(bookshelfId: number, userBookId: number): Promise<void> {
    return this.executeOperation(async () => {
      const result = await this.db
        .delete(bookshelfBooks)
        .where(
          and(
            eq(bookshelfBooks.bookshelfId, bookshelfId),
            eq(bookshelfBooks.userBookId, userBookId)
          )
        )
        .returning({ id: bookshelfBooks.id });

      this.validateRecordsExist(result, 'BookshelfBook');
    }, 'remove book from bookshelf');
  }

  /**
   * Updates book order in bookshelf
   */
  async updateBookOrder(
    bookshelfId: number, 
    userBookId: number, 
    newDisplayOrder: number
  ): Promise<void> {
    return this.executeOperation(async () => {
      const result = await this.db
        .update(bookshelfBooks)
        .set({ displayOrder: newDisplayOrder })
        .where(
          and(
            eq(bookshelfBooks.bookshelfId, bookshelfId),
            eq(bookshelfBooks.userBookId, userBookId)
          )
        )
        .returning({ id: bookshelfBooks.id });

      this.validateRecordsExist(result, 'BookshelfBook');
    }, 'update book order');
  }

  /**
   * Gets bookshelf with books
   */
  async getBookshelfWithBooks(bookshelfId: number): Promise<{
    bookshelf: Bookshelf;
    books: Array<{
      id: number;
      userBookId: number;
      addedAt: Date;
      displayOrder: number;
      book: Book;
      isRead: boolean;
    }>;
  } | null> {
    return this.executeOperation(async () => {
      // Get bookshelf
      const bookshelfResult = await this.db
        .select()
        .from(bookshelves)
        .where(eq(bookshelves.id, bookshelfId))
        .limit(1);

      if (bookshelfResult.length === 0) {
        return null;
      }

      // Get books in bookshelf with details
      const bookResults = await this.db
        .select({
          id: bookshelfBooks.id,
          userBookId: bookshelfBooks.userBookId,
          addedAt: bookshelfBooks.addedAt,
          displayOrder: bookshelfBooks.displayOrder,
          isRead: userBooks.isRead,
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
        .from(bookshelfBooks)
        .innerJoin(userBooks, eq(bookshelfBooks.userBookId, userBooks.id))
        .innerJoin(books, eq(userBooks.bookId, books.id))
        .where(eq(bookshelfBooks.bookshelfId, bookshelfId))
        .orderBy(asc(bookshelfBooks.displayOrder));

      return {
        bookshelf: bookshelfResult[0] as Bookshelf,
        books: bookResults as Array<{
          id: number;
          userBookId: number;
          addedAt: Date;
          displayOrder: number;
          book: Book;
          isRead: boolean;
        }>,
      };
    }, 'get bookshelf with books');
  }

  /**
   * Searches bookshelves by name
   */
  async searchBookshelves(
    query: string,
    options: { 
      isPublicOnly?: boolean;
      limit?: number; 
      offset?: number;
    } = {}
  ): Promise<{ bookshelves: Bookshelf[]; total: number }> {
    return this.executeOperation(async () => {
      const { isPublicOnly = true, limit = 20, offset = 0 } = options;
      const searchPattern = `%${query}%`;

      // Build where conditions
      const whereConditions = [like(bookshelves.name, searchPattern)];
      if (isPublicOnly) {
        whereConditions.push(eq(bookshelves.isPublic, true));
      }

      // Get matching bookshelves
      const bookshelfResults = await this.db
        .select()
        .from(bookshelves)
        .where(and(...whereConditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(bookshelves.createdAt));

      // Get total count
      const totalResult = await this.db
        .select({ count: count() })
        .from(bookshelves)
        .where(and(...whereConditions));

      return {
        bookshelves: bookshelfResults as Bookshelf[],
        total: totalResult[0]?.count || 0,
      };
    }, 'search bookshelves');
  }

  /**
   * Deletes a bookshelf and all its book associations
   */
  async deleteBookshelf(id: number): Promise<void> {
    return this.executeOperation(async () => {
      // Delete all book associations first (due to foreign key constraints)
      await this.db
        .delete(bookshelfBooks)
        .where(eq(bookshelfBooks.bookshelfId, id));

      // Delete the bookshelf
      const result = await this.db
        .delete(bookshelves)
        .where(eq(bookshelves.id, id))
        .returning({ id: bookshelves.id });

      this.validateRecordsExist(result, 'Bookshelf');
    }, 'delete bookshelf');
  }

  /**
   * Checks if user owns a bookshelf
   */
  async isOwner(bookshelfId: number, userId: number): Promise<boolean> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select({ id: bookshelves.id })
        .from(bookshelves)
        .where(
          and(
            eq(bookshelves.id, bookshelfId),
            eq(bookshelves.userId, userId)
          )
        )
        .limit(1);

      return result.length > 0;
    }, 'check bookshelf ownership');
  }

  /**
   * Gets bookshelf book count
   */
  async getBookCount(bookshelfId: number): Promise<number> {
    return this.executeOperation(async () => {
      const result = await this.db
        .select({ count: count() })
        .from(bookshelfBooks)
        .where(eq(bookshelfBooks.bookshelfId, bookshelfId));

      return result[0]?.count || 0;
    }, 'get bookshelf book count');
  }
}