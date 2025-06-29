/**
 * Bookshelf Routes
 * Uses Repository-Service-Controller architecture
 */

import { Router } from 'express';
import type { ControllerContainer } from '../controllers/index.js';
import { authMiddleware } from '../middleware/auth.js';

/**
 * Creates bookshelf routes
 */
export function createBookshelfRoutes(controllers: ControllerContainer): Router {
  const router = Router();

  // GET /api/bookshelves/search - Search bookshelves
  router.get('/search', authMiddleware, controllers.bookshelfController.searchBookshelves);

  // GET /api/bookshelves/public - Get public bookshelves for discovery
  router.get('/public', authMiddleware, controllers.bookshelfController.getPublicBookshelves);

  // POST /api/bookshelves - Create a new bookshelf
  router.post('/', authMiddleware, controllers.bookshelfController.createBookshelf);

  // GET /api/bookshelves - Get user's bookshelves
  router.get('/', authMiddleware, controllers.bookshelfController.getBookshelves);

  // GET /api/bookshelves/:id - Get a bookshelf by ID
  router.get('/:id', authMiddleware, controllers.bookshelfController.getBookshelfById);

  // GET /api/bookshelves/:id/books - Get a bookshelf with its books
  router.get('/:id/books', authMiddleware, controllers.bookshelfController.getBookshelfWithBooks);

  // PUT /api/bookshelves/:id - Update a bookshelf
  router.put('/:id', authMiddleware, controllers.bookshelfController.updateBookshelf);

  // DELETE /api/bookshelves/:id - Delete a bookshelf
  router.delete('/:id', authMiddleware, controllers.bookshelfController.deleteBookshelf);

  // POST /api/bookshelves/:id/books - Add a book to a bookshelf
  router.post('/:id/books', authMiddleware, controllers.bookshelfController.addBookToBookshelf);

  // DELETE /api/bookshelves/:id/books/:userBookId - Remove a book from a bookshelf
  router.delete('/:id/books/:userBookId', authMiddleware, controllers.bookshelfController.removeBookFromBookshelf);

  // PUT /api/bookshelves/:id/books/:userBookId/order - Update book order in bookshelf
  router.put('/:id/books/:userBookId/order', authMiddleware, controllers.bookshelfController.updateBookOrder);

  return router;
}