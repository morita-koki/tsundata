/**
 * Request Validation Middleware
 * Provides schema-based validation for API requests
 */

import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/index.js';
import type { ValidationError as ValidationErrorType } from '../types/common.js';

// Simple validation schema types
export interface ValidationSchema {
  [key: string]: FieldValidator;
}

export interface FieldValidator {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'isbn';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: any[];
  custom?: (value: any) => string | null; // returns error message or null
}

/**
 * Validates a single field according to its validator
 */
function validateField(
  fieldName: string, 
  value: any, 
  validator: FieldValidator
): ValidationErrorType | null {
  // Check if field is required
  if (validator.required && (value === undefined || value === null || value === '')) {
    return { field: fieldName, message: 'This field is required' };
  }

  // Skip validation if field is not required and empty
  if (!validator.required && (value === undefined || value === null || value === '')) {
    return null;
  }

  // Type validation
  if (validator.type) {
    switch (validator.type) {
      case 'string':
        if (typeof value !== 'string') {
          return { field: fieldName, message: 'Must be a string', value };
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { field: fieldName, message: 'Must be a number', value };
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { field: fieldName, message: 'Must be a boolean', value };
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !isValidEmail(value)) {
          return { field: fieldName, message: 'Must be a valid email address', value };
        }
        break;
      case 'isbn':
        if (typeof value !== 'string' || !isValidISBN(value)) {
          return { field: fieldName, message: 'Must be a valid ISBN', value };
        }
        break;
    }
  }

  // String length validation
  if (typeof value === 'string') {
    if (validator.minLength && value.length < validator.minLength) {
      return { 
        field: fieldName, 
        message: `Must be at least ${validator.minLength} characters long`, 
        value 
      };
    }
    if (validator.maxLength && value.length > validator.maxLength) {
      return { 
        field: fieldName, 
        message: `Must be at most ${validator.maxLength} characters long`, 
        value 
      };
    }
  }

  // Number range validation
  if (typeof value === 'number') {
    if (validator.min !== undefined && value < validator.min) {
      return { 
        field: fieldName, 
        message: `Must be at least ${validator.min}`, 
        value 
      };
    }
    if (validator.max !== undefined && value > validator.max) {
      return { 
        field: fieldName, 
        message: `Must be at most ${validator.max}`, 
        value 
      };
    }
  }

  // Pattern validation
  if (validator.pattern && typeof value === 'string') {
    if (!validator.pattern.test(value)) {
      return { 
        field: fieldName, 
        message: 'Invalid format', 
        value 
      };
    }
  }

  // Allowed values validation
  if (validator.allowedValues && !validator.allowedValues.includes(value)) {
    return { 
      field: fieldName, 
      message: `Must be one of: ${validator.allowedValues.join(', ')}`, 
      value 
    };
  }

  // Custom validation
  if (validator.custom) {
    const customError = validator.custom(value);
    if (customError) {
      return { field: fieldName, message: customError, value };
    }
  }

  return null;
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Simple ISBN validation (ISBN-10 or ISBN-13)
 */
function isValidISBN(isbn: string): boolean {
  // Remove hyphens and spaces
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  
  // Check length
  if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
    return false;
  }
  
  // Check if all characters are digits (except last character in ISBN-10 can be X)
  if (cleanISBN.length === 10) {
    return /^\d{9}[\dX]$/i.test(cleanISBN);
  } else {
    return /^\d{13}$/.test(cleanISBN);
  }
}

/**
 * Creates validation middleware for request body
 */
export function validateBody(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: ValidationErrorType[] = [];
    
    // Validate each field in the schema
    for (const [fieldName, validator] of Object.entries(schema)) {
      const fieldError = validateField(fieldName, req.body[fieldName], validator);
      if (fieldError) {
        errors.push(fieldError);
      }
    }
    
    if (errors.length > 0) {
      throw ValidationError.fromFields(errors);
    }
    
    next();
  };
}

/**
 * Creates validation middleware for query parameters
 */
export function validateQuery(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: ValidationErrorType[] = [];
    
    // Convert query parameters to appropriate types
    const processedQuery: any = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        // Try to convert numeric strings to numbers
        if (/^\d+$/.test(value)) {
          processedQuery[key] = parseInt(value, 10);
        } else if (/^\d*\.\d+$/.test(value)) {
          processedQuery[key] = parseFloat(value);
        } else if (value === 'true' || value === 'false') {
          processedQuery[key] = value === 'true';
        } else {
          processedQuery[key] = value;
        }
      } else {
        processedQuery[key] = value;
      }
    }
    
    // Validate each field in the schema
    for (const [fieldName, validator] of Object.entries(schema)) {
      const fieldError = validateField(fieldName, processedQuery[fieldName], validator);
      if (fieldError) {
        errors.push(fieldError);
      }
    }
    
    if (errors.length > 0) {
      throw ValidationError.fromFields(errors);
    }
    
    // Attach processed query to request
    req.query = processedQuery;
    next();
  };
}

/**
 * Creates validation middleware for URL parameters
 */
export function validateParams(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: ValidationErrorType[] = [];
    
    // Validate each field in the schema
    for (const [fieldName, validator] of Object.entries(schema)) {
      const fieldError = validateField(fieldName, req.params[fieldName], validator);
      if (fieldError) {
        errors.push(fieldError);
      }
    }
    
    if (errors.length > 0) {
      throw ValidationError.fromFields(errors);
    }
    
    next();
  };
}

// Common validation schemas
export const commonSchemas = {
  pagination: {
    page: { type: 'number' as const, min: 1 },
    limit: { type: 'number' as const, min: 1, max: 100 },
    offset: { type: 'number' as const, min: 0 },
  },
  
  id: {
    id: { required: true, type: 'number' as const, min: 1 },
  },
  
  isbn: {
    isbn: { required: true, type: 'isbn' as const },
  },
  
  bookshelf: {
    name: { required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
    description: { type: 'string' as const, maxLength: 500 },
    isPublic: { type: 'boolean' as const },
  },
  
  userBook: {
    userBookId: { required: true, type: 'number' as const, min: 1 },
    displayOrder: { type: 'number' as const, min: 0 },
  },
} as const;