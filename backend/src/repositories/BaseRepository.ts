/**
 * Base Repository class
 * Provides common database operations and error handling
 */

import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { 
  DatabaseError, 
  DatabaseConstraintError, 
  DatabaseUniqueConstraintError,
  DatabaseForeignKeyError 
} from '../errors/index.js';

// Type for our database instance
export type Database = BetterSQLite3Database<Record<string, unknown>>;

export abstract class BaseRepository {
  protected db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Handles database errors and converts them to appropriate custom errors
   */
  protected handleDatabaseError(error: Error, operation?: string): never {
    const errorMessage = error.message.toLowerCase();
    
    // Handle unique constraint violations
    if (errorMessage.includes('unique constraint failed')) {
      const match = errorMessage.match(/unique constraint failed: (\w+)\.(\w+)/);
      if (match) {
        const [, , field] = match;
        throw new DatabaseUniqueConstraintError(field ?? 'unknown', 'duplicate value', error);
      }
      throw new DatabaseConstraintError(
        'Unique constraint violation',
        'unknown_unique',
        'UNIQUE',
        error
      );
    }

    // Handle foreign key constraint violations
    if (errorMessage.includes('foreign key constraint failed')) {
      throw new DatabaseForeignKeyError(undefined, undefined, error);
    }

    // Handle other constraint violations
    if (errorMessage.includes('constraint failed')) {
      throw new DatabaseConstraintError(
        'Database constraint violation',
        'unknown_constraint',
        'UNKNOWN',
        error
      );
    }

    // Handle connection errors
    if (errorMessage.includes('database is locked') || 
        errorMessage.includes('database disk image is malformed')) {
      throw new DatabaseError('Database connection error', error);
    }

    // Generic database error
    throw new DatabaseError(
      `Database operation failed${operation ? ` during ${operation}` : ''}`,
      error
    );
  }

  /**
   * Executes a database operation with error handling
   */
  protected async executeOperation<T>(
    operation: () => Promise<T> | T,
    operationName?: string
  ): Promise<T> {
    try {
      return await Promise.resolve(operation());
    } catch (error) {
      this.handleDatabaseError(error as Error, operationName);
    }
  }

  /**
   * Validates that a record exists
   */
  protected validateRecordExists<T>(
    record: T | undefined | null,
    resourceType: string,
    resourceId: string | number
  ): asserts record is T {
    if (!record) {
      throw new DatabaseError(`${resourceType} with ID ${resourceId} not found`);
    }
  }

  /**
   * Validates that records exist
   */
  protected validateRecordsExist<T>(
    records: T[],
    resourceType: string,
    minCount: number = 1
  ): void {
    if (records.length < minCount) {
      throw new DatabaseError(`Expected at least ${minCount} ${resourceType}(s), found ${records.length}`);
    }
  }
}