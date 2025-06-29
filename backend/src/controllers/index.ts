/**
 * Controller exports
 * Centralized export for all controllers
 */

export { AuthController } from './AuthController.js';
export { BookController } from './BookController.js';
export { BookshelfController } from './BookshelfController.js';
export { UserController } from './UserController.js';
export { BaseController } from './BaseController.js';

// Controller container type for dependency injection
import type { ServiceContainer } from '../services/index.js';
import { AuthController } from './AuthController.js';
import { BookController } from './BookController.js';
import { BookshelfController } from './BookshelfController.js';
import { UserController } from './UserController.js';

export interface ControllerContainer {
  authController: AuthController;
  bookController: BookController;
  bookshelfController: BookshelfController;
  userController: UserController;
}

/**
 * Creates controller container with service dependencies
 */
export function createControllerContainer(services: ServiceContainer): ControllerContainer {
  return {
    authController: new AuthController(services),
    bookController: new BookController(services),
    bookshelfController: new BookshelfController(services),
    userController: new UserController(services),
  };
}