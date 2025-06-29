/**
 * Validation related errors
 */

import { BaseError } from './BaseError.js';
import { HttpStatusCode } from '../types/common.js';
import type { ValidationError as ValidationErrorType } from '../types/common.js';

export class ValidationError extends BaseError {
  public readonly fields: ValidationErrorType[];

  constructor(
    message: string = 'Validation failed',
    fields: ValidationErrorType[] = [],
    details?: any
  ) {
    super(message, HttpStatusCode.BAD_REQUEST, true, details);
    this.fields = fields;
  }

  /**
   * Creates a ValidationError from a single field error
   */
  static fromField(field: string, message: string, value?: any): ValidationError {
    return new ValidationError('Validation failed', [{ field, message, value }]);
  }

  /**
   * Creates a ValidationError from multiple field errors
   */
  static fromFields(fields: ValidationErrorType[]): ValidationError {
    return new ValidationError('Validation failed', fields);
  }

  /**
   * Returns client-safe JSON with field-specific errors
   */
  override toClientJSON() {
    return {
      ...super.toClientJSON(),
      fields: this.fields,
    };
  }
}

export class RequiredFieldError extends ValidationError {
  constructor(field: string) {
    super(`${field} is required`, [{ field, message: 'This field is required' }]);
  }
}

export class InvalidFormatError extends ValidationError {
  constructor(field: string, expectedFormat: string, value?: any) {
    super(
      `${field} has invalid format. Expected: ${expectedFormat}`,
      [{ field, message: `Invalid format. Expected: ${expectedFormat}`, value }]
    );
  }
}

export class InvalidLengthError extends ValidationError {
  constructor(field: string, min?: number, max?: number, actual?: number) {
    let message = 'Invalid length';
    if (min && max) {
      message = `Length must be between ${min} and ${max} characters`;
    } else if (min) {
      message = `Length must be at least ${min} characters`;
    } else if (max) {
      message = `Length must be at most ${max} characters`;
    }

    super(`${field} has invalid length`, [
      { field, message, value: { min, max, actual } },
    ]);
  }
}

export class InvalidValueError extends ValidationError {
  constructor(field: string, value: any, allowedValues?: any[]) {
    const message = allowedValues
      ? `Invalid value. Allowed values: ${allowedValues.join(', ')}`
      : 'Invalid value';

    super(`${field} has invalid value`, [{ field, message, value }]);
  }
}

export class DuplicateValueError extends ValidationError {
  constructor(field: string, value: any) {
    super(`${field} already exists`, [
      { field, message: 'This value already exists', value },
    ]);
  }
}