/**
 * Database related errors
 */

import { BaseError } from './BaseError.js';
import { HttpStatusCode } from '../types/common.js';

export class DatabaseError extends BaseError {
  public readonly query?: string | undefined;
  public readonly originalError?: Error | undefined;

  constructor(
    message: string,
    originalError?: Error,
    query?: string,
    details?: any
  ) {
    super(message, HttpStatusCode.INTERNAL_SERVER_ERROR, true, details);
    
    this.originalError = originalError;
    this.query = query;
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(originalError?: Error) {
    super('Database connection failed', originalError);
  }
}

export class DatabaseConstraintError extends DatabaseError {
  public readonly constraintName?: string | undefined;
  public readonly constraintType?: string | undefined;

  constructor(
    message: string,
    constraintName?: string,
    constraintType?: string,
    originalError?: Error
  ) {
    super(message, originalError);
    this.constraintName = constraintName;
    this.constraintType = constraintType;
  }
}

export class DatabaseUniqueConstraintError extends DatabaseConstraintError {
  public readonly field: string;
  public readonly value: any;

  constructor(field: string, value: any, originalError?: Error) {
    const message = `Duplicate value for ${field}: ${value}`;
    super(message, field, 'UNIQUE', originalError);
    
    this.field = field;
    this.value = value;
  }
}

export class DatabaseForeignKeyError extends DatabaseConstraintError {
  public readonly referencedTable?: string | undefined;
  public readonly referencedField?: string | undefined;

  constructor(
    referencedTable?: string,
    referencedField?: string,
    originalError?: Error
  ) {
    const message = referencedTable && referencedField
      ? `Foreign key constraint failed: ${referencedTable}.${referencedField}`
      : 'Foreign key constraint failed';
    
    super(message, `${referencedTable}_${referencedField}`, 'FOREIGN_KEY', originalError);
    
    this.referencedTable = referencedTable;
    this.referencedField = referencedField;
  }
}

export class DatabaseTransactionError extends DatabaseError {
  public readonly transactionType?: string | undefined;

  constructor(message: string, transactionType?: string, originalError?: Error) {
    super(message, originalError);
    this.transactionType = transactionType;
  }
}

export class DatabaseQueryError extends DatabaseError {
  public readonly queryType?: string | undefined;

  constructor(
    message: string,
    query?: string,
    queryType?: string,
    originalError?: Error
  ) {
    super(message, originalError, query);
    this.queryType = queryType;
  }
}

export class DatabaseMigrationError extends DatabaseError {
  public readonly migrationVersion?: string | undefined;

  constructor(migrationVersion?: string, originalError?: Error) {
    const message = `Database migration failed${
      migrationVersion ? ` at version ${migrationVersion}` : ''
    }`;
    super(message, originalError);
    this.migrationVersion = migrationVersion;
  }
}