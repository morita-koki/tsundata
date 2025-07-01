/**
 * Validation Middleware
 * Unified validation using Zod schemas
 */

import type { Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '../errors/index.js';
import type { AuthRequest } from '../types/auth.js';

export interface ValidationSchema {
  body?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
  query?: z.ZodSchema<any>;
}

/**
 * Formats Zod validation errors into readable messages
 */
function formatZodError(error: ZodError): string {
  const messages = error.errors.map(err => {
    const path = err.path.length > 0 ? err.path.join('.') : 'root';
    return `${path}: ${err.message}`;
  });

  if (messages.length === 1) {
    return messages[0]!;
  }

  return `Multiple validation errors: ${messages.join(', ')}`;
}

/**
 * Validates and transforms request data using Zod schemas
 */
function validateAndTransform<T extends ValidationSchema>(
  req: AuthRequest,
  schema: T
): {
  body?: T['body'] extends z.ZodSchema<infer U> ? U : never;
  params?: T['params'] extends z.ZodSchema<infer U> ? U : never;
  query?: T['query'] extends z.ZodSchema<infer U> ? U : never;
} {
  const result: any = {};

  try {
    // Validate and transform body
    if (schema.body) {
      result.body = schema.body.parse(req.body);
    }

    // Validate and transform params
    if (schema.params) {
      result.params = schema.params.parse(req.params);
    }

    // Validate and transform query
    if (schema.query) {
      result.query = schema.query.parse(req.query);
    }

    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(formatZodError(error));
    }
    throw error;
  }
}

/**
 * Creates a validation middleware for the specified schema
 */
export function validate<T extends ValidationSchema>(schema: T) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    try {
      const validated = validateAndTransform(req, schema);

      // Attach validated data to request
      if (validated.body !== undefined) {
        req.validatedBody = validated.body;
      }
      if (validated.params !== undefined) {
        req.validatedParams = validated.params;
      }
      if (validated.query !== undefined) {
        req.validatedQuery = validated.query;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Convenience function for body-only validation
 */
export function validateBody<T extends z.ZodSchema<any>>(schema: T) {
  return validate({ body: schema });
}

/**
 * Convenience function for params-only validation
 */
export function validateParams<T extends z.ZodSchema<any>>(schema: T) {
  return validate({ params: schema });
}

/**
 * Convenience function for query-only validation
 */
export function validateQuery<T extends z.ZodSchema<any>>(schema: T) {
  return validate({ query: schema });
}

/**
 * Generic validation function that can be used with pre-defined schemas
 */
export function validateWith<T extends ValidationSchema>(schema: T) {
  return validate(schema);
}

/**
 * Extension to AuthRequest to include validated data
 */
declare global {
  namespace Express {
    interface Request {
      validatedBody?: any;
      validatedParams?: any;
      validatedQuery?: any;
    }
  }
}

// Type helpers for better TypeScript experience
export type ValidatedRequest<
  TBody = any,
  TParams = any,
  TQuery = any
> = AuthRequest & {
  validatedBody: TBody;
  validatedParams: TParams;
  validatedQuery: TQuery;
};

export type ValidatedBodyRequest<T> = AuthRequest & {
  validatedBody: T;
};

export type ValidatedParamsRequest<T> = AuthRequest & {
  validatedParams: T;
};

export type ValidatedQueryRequest<T> = AuthRequest & {
  validatedQuery: T;
};