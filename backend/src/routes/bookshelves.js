import express from 'express';
import { db } from '../config/database.js';
import { bookshelves, bookshelfBooks, userBooks, books, users } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { eq, and, sql, count } from 'drizzle-orm';

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, isPublic = false } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Bookshelf name is required' });
    }

    const newBookshelf = await db.insert(bookshelves).values({
      userId,
      name,
      description,
      isPublic,
      createdAt: new Date()
    }).returning();

    res.status(201).json(newBookshelf[0]);
  } catch (error) {
    console.error('Create bookshelf error:', error);
    res.status(500).json({ error: 'Failed to create bookshelf' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get bookshelves first
    const userBookshelves = await db.select()
      .from(bookshelves)
      .where(eq(bookshelves.userId, userId));

    // Get book counts for each bookshelf
    const bookshelvesWithBooks = await Promise.all(
      userBookshelves.map(async (shelf) => {
        const bookCount = await db.select({ count: sql`COUNT(*)` })
          .from(bookshelfBooks)
          .where(eq(bookshelfBooks.bookshelfId, shelf.id));
        
        return {
          ...shelf,
          books: Array(Number(bookCount[0]?.count) || 0).fill(null) // Create array with correct length for counting
        };
      })
    );

    res.json(bookshelvesWithBooks);
  } catch (error) {
    console.error('Get bookshelves error:', error);
    res.status(500).json({ error: 'Failed to get bookshelves' });
  }
});

router.get('/public', async (req, res) => {
  try {
    const publicBookshelves = await db.select({
      id: bookshelves.id,
      name: bookshelves.name,
      description: bookshelves.description,
      createdAt: bookshelves.createdAt,
      user: {
        id: users.id,
        username: users.username
      }
    })
    .from(bookshelves)
    .innerJoin(users, eq(bookshelves.userId, users.id))
    .where(eq(bookshelves.isPublic, true));

    res.json(publicBookshelves);
  } catch (error) {
    console.error('Get public bookshelves error:', error);
    res.status(500).json({ error: 'Failed to get public bookshelves' });
  }
});

router.get('/:bookshelfId', async (req, res) => {
  try {
    const { bookshelfId } = req.params;

    const bookshelf = await db.select({
      id: bookshelves.id,
      name: bookshelves.name,
      description: bookshelves.description,
      isPublic: bookshelves.isPublic,
      createdAt: bookshelves.createdAt,
      user: {
        id: users.id,
        username: users.username
      }
    })
    .from(bookshelves)
    .innerJoin(users, eq(bookshelves.userId, users.id))
    .where(eq(bookshelves.id, bookshelfId))
    .limit(1);

    if (bookshelf.length === 0) {
      return res.status(404).json({ error: 'Bookshelf not found' });
    }

    const bookshelfWithBooks = await db.select({
      userBookId: bookshelfBooks.userBookId,
      addedAt: bookshelfBooks.addedAt,
      displayOrder: bookshelfBooks.displayOrder,
      isRead: userBooks.isRead,
      readAt: userBooks.readAt,
      bookId: books.id,
      isbn: books.isbn,
      title: books.title,
      author: books.author,
      publisher: books.publisher,
      publishedDate: books.publishedDate,
      description: books.description,
      pageCount: books.pageCount,
      thumbnail: books.thumbnail,
      price: books.price
    })
    .from(bookshelfBooks)
    .innerJoin(userBooks, eq(bookshelfBooks.userBookId, userBooks.id))
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(eq(bookshelfBooks.bookshelfId, bookshelfId))
    .orderBy(bookshelfBooks.displayOrder);

    // Transform the data to match expected structure
    const transformedBooks = bookshelfWithBooks.map(row => ({
      userBookId: row.userBookId,
      addedAt: row.addedAt,
      displayOrder: row.displayOrder,
      isRead: row.isRead,
      readAt: row.readAt,
      book: {
        id: row.bookId,
        isbn: row.isbn,
        title: row.title,
        author: row.author,
        publisher: row.publisher,
        publishedDate: row.publishedDate,
        description: row.description,
        pageCount: row.pageCount,
        thumbnail: row.thumbnail,
        price: row.price
      }
    }));

    res.json({
      ...bookshelf[0],
      books: transformedBooks
    });
  } catch (error) {
    console.error('Get bookshelf error:', error);
    res.status(500).json({ error: 'Failed to get bookshelf' });
  }
});

router.post('/:bookshelfId/books', authenticateToken, async (req, res) => {
  try {
    const { bookshelfId } = req.params;
    const { userBookId } = req.body;
    const userId = req.user.id;

    const bookshelf = await db.select()
      .from(bookshelves)
      .where(and(eq(bookshelves.id, bookshelfId), eq(bookshelves.userId, userId)))
      .limit(1);

    if (bookshelf.length === 0) {
      return res.status(404).json({ error: 'Bookshelf not found' });
    }

    const userBook = await db.select()
      .from(userBooks)
      .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, userId)))
      .limit(1);

    if (userBook.length === 0) {
      return res.status(404).json({ error: 'Book not found in your library' });
    }

    const existingBookshelfBook = await db.select()
      .from(bookshelfBooks)
      .where(and(eq(bookshelfBooks.bookshelfId, bookshelfId), eq(bookshelfBooks.userBookId, userBookId)))
      .limit(1);

    if (existingBookshelfBook.length > 0) {
      return res.status(400).json({ error: 'Book already in bookshelf' });
    }

    // Get the next display order
    const maxOrderResult = await db.select({
      maxOrder: sql`MAX(display_order)`
    }).from(bookshelfBooks).where(eq(bookshelfBooks.bookshelfId, bookshelfId));
    
    const nextOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

    const newBookshelfBook = await db.insert(bookshelfBooks).values({
      bookshelfId: parseInt(bookshelfId),
      userBookId,
      addedAt: new Date(),
      displayOrder: nextOrder
    }).returning();

    res.status(201).json(newBookshelfBook[0]);
  } catch (error) {
    console.error('Add book to bookshelf error:', error);
    res.status(500).json({ error: 'Failed to add book to bookshelf' });
  }
});

router.patch('/:bookshelfId', authenticateToken, async (req, res) => {
  try {
    const { bookshelfId } = req.params;
    const { name, description, isPublic } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedBookshelf = await db.update(bookshelves)
      .set(updateData)
      .where(and(eq(bookshelves.id, parseInt(bookshelfId)), eq(bookshelves.userId, userId)))
      .returning();

    if (updatedBookshelf.length === 0) {
      return res.status(404).json({ error: 'Bookshelf not found' });
    }

    res.json(updatedBookshelf[0]);
  } catch (error) {
    console.error('Update bookshelf error:', error);
    res.status(500).json({ error: 'Failed to update bookshelf' });
  }
});

router.delete('/:bookshelfId', authenticateToken, async (req, res) => {
  try {
    const { bookshelfId } = req.params;
    const userId = req.user.id;

    await db.delete(bookshelfBooks)
      .where(eq(bookshelfBooks.bookshelfId, bookshelfId));

    const deletedBookshelf = await db.delete(bookshelves)
      .where(and(eq(bookshelves.id, bookshelfId), eq(bookshelves.userId, userId)))
      .returning();

    if (deletedBookshelf.length === 0) {
      return res.status(404).json({ error: 'Bookshelf not found' });
    }

    res.json({ message: 'Bookshelf deleted successfully' });
  } catch (error) {
    console.error('Delete bookshelf error:', error);
    res.status(500).json({ error: 'Failed to delete bookshelf' });
  }
});

router.delete('/:bookshelfId/books/:userBookId', authenticateToken, async (req, res) => {
  try {
    const { bookshelfId, userBookId } = req.params;
    const userId = req.user.id;

    const bookshelf = await db.select()
      .from(bookshelves)
      .where(and(eq(bookshelves.id, bookshelfId), eq(bookshelves.userId, userId)))
      .limit(1);

    if (bookshelf.length === 0) {
      return res.status(404).json({ error: 'Bookshelf not found' });
    }

    const deletedBookshelfBook = await db.delete(bookshelfBooks)
      .where(and(eq(bookshelfBooks.bookshelfId, bookshelfId), eq(bookshelfBooks.userBookId, userBookId)))
      .returning();

    if (deletedBookshelfBook.length === 0) {
      return res.status(404).json({ error: 'Book not found in bookshelf' });
    }

    res.json({ message: 'Book removed from bookshelf successfully' });
  } catch (error) {
    console.error('Remove book from bookshelf error:', error);
    res.status(500).json({ error: 'Failed to remove book from bookshelf' });
  }
});

router.patch('/:bookshelfId/books/reorder', authenticateToken, async (req, res) => {
  try {
    const { bookshelfId } = req.params;
    const { bookOrders } = req.body; // Array of { userBookId, displayOrder }
    const userId = req.user.id;

    // Verify bookshelf ownership
    const bookshelf = await db.select()
      .from(bookshelves)
      .where(and(eq(bookshelves.id, bookshelfId), eq(bookshelves.userId, userId)))
      .limit(1);

    if (bookshelf.length === 0) {
      return res.status(404).json({ error: 'Bookshelf not found' });
    }

    // Validate input
    if (!Array.isArray(bookOrders) || bookOrders.length === 0) {
      return res.status(400).json({ error: 'Invalid book order data' });
    }

    // Update display orders in a transaction
    await db.transaction(async (tx) => {
      for (const { userBookId, displayOrder } of bookOrders) {
        await tx.update(bookshelfBooks)
          .set({ displayOrder })
          .where(and(
            eq(bookshelfBooks.bookshelfId, bookshelfId),
            eq(bookshelfBooks.userBookId, userBookId)
          ));
      }
    });

    res.json({ message: 'Book order updated successfully' });
  } catch (error) {
    console.error('Reorder books error:', error);
    res.status(500).json({ error: 'Failed to reorder books' });
  }
});

export default router;