/**
 * Routes index
 * Centralizes route creation using Repository-Service-Controller architecture
 */

import type { ControllerContainer } from '../controllers/index.js';
import { createAuthRoutes } from './auth.js';
import { createBookRoutes } from './books.js';
import { createUserRoutes } from './users.js';
import { createBookshelfRoutes } from './bookshelves.js';

export interface RouteContainer {
  authRoutes: ReturnType<typeof createAuthRoutes>;
  bookRoutes: ReturnType<typeof createBookRoutes>;
  userRoutes: ReturnType<typeof createUserRoutes>;
  bookshelfRoutes: ReturnType<typeof createBookshelfRoutes>;
}

/**
 * Creates all routes with controller dependencies
 */
export function createRoutes(controllers: ControllerContainer): RouteContainer {
  return {
    authRoutes: createAuthRoutes(controllers),
    bookRoutes: createBookRoutes(controllers),
    userRoutes: createUserRoutes(controllers),
    bookshelfRoutes: createBookshelfRoutes(controllers),
  };
}

// Re-export route creators for direct use
export { createAuthRoutes } from './auth.js';
export { createBookRoutes } from './books.js';
export { createUserRoutes } from './users.js';
export { createBookshelfRoutes } from './bookshelves.js';