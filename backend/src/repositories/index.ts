/**
 * Repository index
 * Re-exports all repository classes and creates database connection
 */

import { db } from '../config/database.js';
import { UserRepository } from './UserRepository.js';
import { BookRepository } from './BookRepository.js';
import { BookshelfRepository } from './BookshelfRepository.js';

// Export repository classes
export { BaseRepository } from './BaseRepository.js';
export { UserRepository } from './UserRepository.js';
export { BookRepository } from './BookRepository.js';
export { BookshelfRepository } from './BookshelfRepository.js';

// Export database type
export type { Database } from './BaseRepository.js';

// Create repository instances with shared database connection
export const userRepository = new UserRepository(db);
export const bookRepository = new BookRepository(db);
export const bookshelfRepository = new BookshelfRepository(db);

// Repository container for dependency injection
export interface RepositoryContainer {
  userRepository: UserRepository;
  bookRepository: BookRepository;
  bookshelfRepository: BookshelfRepository;
}

export const repositories: RepositoryContainer = {
  userRepository,
  bookRepository,
  bookshelfRepository,
};

/**
 * Creates a new set of repository instances
 * Useful for testing or when you need fresh instances
 */
export function createRepositories(database = db): RepositoryContainer {
  return {
    userRepository: new UserRepository(database),
    bookRepository: new BookRepository(database),
    bookshelfRepository: new BookshelfRepository(database),
  };
}

/**
 * Creates repository container with default database
 */
export function createRepositoryContainer(): RepositoryContainer {
  return createRepositories();
}