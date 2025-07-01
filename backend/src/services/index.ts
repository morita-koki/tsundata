/**
 * Service index
 * Re-exports all service classes and creates service instances
 */

import { repositories } from '../repositories/index.js';
import { UserService } from './UserService.js';
import { BookService } from './BookService.js';
import { BookshelfService } from './BookshelfService.js';
import { BookSearchService } from './BookSearchService.js';
import { ISBNService } from './ISBNService.js';

// Export service classes
export { BaseService } from './BaseService.js';
export { UserService } from './UserService.js';
export { BookService } from './BookService.js';
export { BookshelfService } from './BookshelfService.js';
export { BookSearchService } from './BookSearchService.js';
export { ISBNService } from './ISBNService.js';

// Create service instances with shared repository container
export const userService = new UserService(repositories);
export const bookService = new BookService(repositories);
export const bookshelfService = new BookshelfService(repositories);
export const bookSearchService = new BookSearchService(repositories);
export const isbnService = new ISBNService(repositories);

// Service container for dependency injection
export interface ServiceContainer {
  userService: UserService;
  bookService: BookService;
  bookshelfService: BookshelfService;
  bookSearchService: BookSearchService;
  isbnService: ISBNService;
}

export const services: ServiceContainer = {
  userService,
  bookService,
  bookshelfService,
  bookSearchService,
  isbnService,
};

/**
 * Creates a new set of service instances
 * Useful for testing or when you need fresh instances
 */
export function createServices(repositoryContainer = repositories): ServiceContainer {
  return {
    userService: new UserService(repositoryContainer),
    bookService: new BookService(repositoryContainer),
    bookshelfService: new BookshelfService(repositoryContainer),
    bookSearchService: new BookSearchService(repositoryContainer),
    isbnService: new ISBNService(repositoryContainer),
  };
}

/**
 * Creates service container with repository dependencies
 */
import type { RepositoryContainer } from '../repositories/index.js';

export function createServiceContainer(repositories: RepositoryContainer): ServiceContainer {
  return createServices(repositories);
}