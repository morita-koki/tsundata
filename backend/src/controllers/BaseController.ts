/**
 * Base Controller class
 * Provides common controller patterns and response handling
 */

import type { Response } from 'express';
import type { ServiceContainer } from '../services/index.js';
import type { AuthRequest } from '../types/auth.js';
import type { ApiResponse, PaginatedResponse } from '../types/api.js';
import { HttpStatusCode } from '../types/common.js';

export abstract class BaseController {
  protected services: ServiceContainer;

  constructor(services: ServiceContainer) {
    this.services = services;
  }

  /**
   * Sends a successful response
   */
  protected sendSuccess<T>(
    res: Response,
    data: T,
    statusCode: HttpStatusCode = HttpStatusCode.OK
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
    };
    res.status(statusCode).json(response);
  }

  /**
   * Sends a successful response for created resources
   */
  protected sendCreated<T>(res: Response, data: T): void {
    this.sendSuccess(res, data, HttpStatusCode.CREATED);
  }

  /**
   * Sends a successful response with no content
   */
  protected sendNoContent(res: Response): void {
    res.status(HttpStatusCode.NO_CONTENT).send();
  }

  /**
   * Sends a paginated response
   */
  protected sendPaginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    statusCode: HttpStatusCode = HttpStatusCode.OK
  ): void {
    const totalPages = Math.ceil(total / limit);
    const response: PaginatedResponse<T> = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
    res.status(statusCode).json(response);
  }

  /**
   * Gets the authenticated user from request
   */
  protected getAuthenticatedUser(req: AuthRequest) {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return req.user;
  }

  /**
   * Gets the user ID from authenticated request
   */
  protected getUserId(req: AuthRequest): number {
    return this.getAuthenticatedUser(req).id;
  }

  /**
   * Extracts pagination parameters from request
   */
  protected getPaginationParams(req: AuthRequest): {
    page: number;
    limit: number;
  } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    
    return { page, limit };
  }

  /**
   * Extracts and validates ID parameter from request
   */
  protected getIdParam(req: AuthRequest, paramName: string = 'id'): number {
    const idString = req.params[paramName];
    if (!idString) {
      throw new Error(`Missing ${paramName} parameter`);
    }
    const id = parseInt(idString, 10);
    
    if (isNaN(id) || id <= 0) {
      throw new Error(`Invalid ${paramName}: must be a positive integer`);
    }
    
    return id;
  }

  /**
   * Safely gets string parameter from request
   */
  protected getStringParam(req: AuthRequest, paramName: string): string {
    const value = req.params[paramName];
    if (!value || typeof value !== 'string') {
      throw new Error(`Missing or invalid ${paramName} parameter`);
    }
    return value;
  }

  /**
   * Gets optional query parameter as string
   */
  protected getOptionalStringQuery(req: AuthRequest, queryName: string): string | undefined {
    const value = req.query[queryName];
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Gets optional query parameter as boolean
   */
  protected getOptionalBooleanQuery(req: AuthRequest, queryName: string): boolean | undefined {
    const value = req.query[queryName];
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  }

  /**
   * Gets optional query parameter as number
   */
  protected getOptionalNumberQuery(req: AuthRequest, queryName: string): number | undefined {
    const value = req.query[queryName];
    if (value === undefined || value === null) {
      return undefined;
    }
    const num = parseInt(value as string, 10);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Validates required request body fields
   */
  protected validateRequiredFields(body: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => 
      body[field] === undefined || body[field] === null || body[field] === ''
    );
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Validates that request body exists
   */
  protected validateRequestBody(body: any): void {
    if (!body || typeof body !== 'object') {
      throw new Error('Request body is required');
    }
  }
}