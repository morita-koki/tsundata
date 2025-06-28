import express from 'express';
import { db } from '../config/database.js';
import { books, userBooks } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { eq, and } from 'drizzle-orm';
import { searchBookByISBN } from '../utils/bookSearch.js';
import { ISBN } from '../models/valueObjects/ISBN.js';

const router = express.Router();

router.get('/search/:isbn', async (req, res) => {
  try {
    const { isbn: isbnParam } = req.params;
    console.log(`📚 Book search requested for ISBN: ${isbnParam}`);
    
    const isbn = new ISBN(isbnParam);
    console.log(`📚 Validated ISBN: ${isbn.toString()}`);
    
    const existingBook = await db.select()
      .from(books)
      .where(eq(books.isbn, isbn.toString()))
      .limit(1);

    if (existingBook.length > 0) {
      console.log(`📖 Found existing book in database: ${existingBook[0].title}`);
      return res.json(existingBook[0]);
    }

    console.log(`🔍 Searching external APIs for ISBN: ${isbn.toString()}`);
    const bookData = await searchBookByISBN(isbn.toString());

    if (!bookData) {
      console.log(`❌ No valid book data found for ISBN: ${isbn.toString()}`);
      return res.status(404).json({ error: 'Book not found or missing required information (title/author)' });
    }

    console.log(`✅ Book data found: ${bookData.title} by ${bookData.author}`);

    const newBook = await db.insert(books).values({
      isbn: bookData.isbn,
      title: bookData.title,
      author: bookData.author,
      publisher: bookData.publisher,
      publishedDate: bookData.publishedDate,
      description: bookData.description,
      pageCount: bookData.pageCount,
      thumbnail: bookData.thumbnail,
      price: bookData.price,
      series: bookData.series,
      createdAt: new Date()
    }).returning();

    console.log(`💾 Book saved to database with ID: ${newBook[0].id}`);
    res.json(newBook[0]);
  } catch (error) {
    console.error('❌ Book search error:', error);
    if (error.message.includes('Invalid ISBN format') || error.message.includes('ISBN cannot be empty')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to search book' });
  }
});

router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { bookId, isRead = false } = req.body;
    const userId = req.user.id;
    console.log(`📚 Adding book to library - User: ${userId}, Book: ${bookId}, Read: ${isRead}`);

    const existingUserBook = await db.select()
      .from(userBooks)
      .where(and(eq(userBooks.userId, userId), eq(userBooks.bookId, bookId)))
      .limit(1);

    if (existingUserBook.length > 0) {
      console.log(`⚠️ Book already exists in user's library`);
      return res.status(400).json({ error: 'Book already in your library' });
    }

    const newUserBook = await db.insert(userBooks).values({
      userId,
      bookId,
      isRead,
      addedAt: new Date(),
      readAt: isRead ? new Date() : null
    }).returning();

    console.log(`✅ Book added to library successfully with ID: ${newUserBook[0].id}`);
    res.status(201).json(newUserBook[0]);
  } catch (error) {
    console.error('❌ Add book error:', error);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

router.get('/library', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📚 Getting library for user: ${userId}`);
    
    const userLibrary = await db.select({
      id: userBooks.id,
      isRead: userBooks.isRead,
      addedAt: userBooks.addedAt,
      readAt: userBooks.readAt,
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
        price: books.price
      }
    })
    .from(userBooks)
    .innerJoin(books, eq(userBooks.bookId, books.id))
    .where(eq(userBooks.userId, userId));

    console.log(`📖 Found ${userLibrary.length} books in library`);
    console.log('📊 Library data sample:', userLibrary.length > 0 ? userLibrary[0] : 'No books');
    
    res.json(userLibrary);
  } catch (error) {
    console.error('❌ Get library error:', error);
    res.status(500).json({ error: 'Failed to get library' });
  }
});

router.patch('/read/:userBookId', authenticateToken, async (req, res) => {
  try {
    const { userBookId } = req.params;
    const { isRead } = req.body;
    const userId = req.user.id;

    const updatedUserBook = await db.update(userBooks)
      .set({
        isRead,
        readAt: isRead ? new Date() : null
      })
      .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, userId)))
      .returning();

    if (updatedUserBook.length === 0) {
      return res.status(404).json({ error: 'Book not found in your library' });
    }

    res.json(updatedUserBook[0]);
  } catch (error) {
    console.error('Update read status error:', error);
    res.status(500).json({ error: 'Failed to update read status' });
  }
});

router.delete('/remove/:userBookId', authenticateToken, async (req, res) => {
  try {
    const { userBookId } = req.params;
    const userId = req.user.id;
    console.log(`🗑️ Removing book from library - User: ${userId}, UserBook: ${userBookId}`);

    // まず、該当する本がユーザーのライブラリに存在するか確認
    const existingUserBook = await db.select()
      .from(userBooks)
      .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, userId)))
      .limit(1);

    if (existingUserBook.length === 0) {
      console.log(`❌ Book not found in user's library`);
      return res.status(404).json({ error: 'Book not found in your library' });
    }

    // ライブラリから本を削除
    const deletedUserBook = await db.delete(userBooks)
      .where(and(eq(userBooks.id, userBookId), eq(userBooks.userId, userId)))
      .returning();

    console.log(`✅ Book removed from library successfully: ${deletedUserBook[0]?.id}`);
    res.json({ message: 'Book removed from library successfully', userBook: deletedUserBook[0] });
  } catch (error) {
    console.error('❌ Remove book error:', error);
    res.status(500).json({ error: 'Failed to remove book from library' });
  }
});

export default router;