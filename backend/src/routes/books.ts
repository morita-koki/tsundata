/**
 * Book Routes
 * Uses Repository-Service-Controller architecture
 */

import { Router } from 'express';
import type { ControllerContainer } from '../controllers/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateWith, Schemas } from '../validation/index.js';

/**
 * Creates book routes
 */
export function createBookRoutes(controllers: ControllerContainer): Router {
  const router = Router();

  // GET /api/books/search/:isbn - Search for books by ISBN
  router.get('/search/:isbn', validateWith(Schemas.books.searchByISBN), controllers.bookController.searchByISBN);

  // GET /api/books/search - Search books in database
  router.get('/search', authMiddleware, validateWith(Schemas.books.search), controllers.bookController.searchBooks);

  // GET /api/books/:id - Get book by ID
  router.get('/:id', authMiddleware, validateWith(Schemas.books.getById), controllers.bookController.getBookById);

  // POST /api/books/library - Add book to user's library
  router.post('/library', authMiddleware, validateWith(Schemas.books.addToLibrary), controllers.bookController.addToLibrary);

  // GET /api/books/library - Get user's book library
  router.get('/library', authMiddleware, validateWith(Schemas.books.getLibrary), controllers.bookController.getLibrary);

  // GET /api/books/library/:userBookId - Get specific user book
  router.get('/library/:userBookId', authMiddleware, validateWith(Schemas.books.getUserBook), controllers.bookController.getUserBook);

  // PUT /api/books/library/:userBookId/status - Update reading status
  router.put('/library/:userBookId/status', authMiddleware, validateWith(Schemas.books.updateReadingStatus), controllers.bookController.updateReadingStatus);

  // DELETE /api/books/library/:isbn - Remove book from library (backward compatibility)
  router.delete('/library/:isbn', authMiddleware, validateWith(Schemas.books.removeFromLibrary), controllers.bookController.removeFromLibrary);

  return router;
}