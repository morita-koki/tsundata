/**
 * Base Service class
 * Provides common business logic patterns and validation
 */

import type { RepositoryContainer } from '../repositories/index.js';
import { BusinessLogicError, ValidationError } from '../errors/index.js';

export abstract class BaseService {
  protected repositories: RepositoryContainer;

  constructor(repositories: RepositoryContainer) {
    this.repositories = repositories;
  }

  /**
   * Validates that a value is not null or undefined
   */
  protected validateRequired<T>(
    value: T | null | undefined,
    fieldName: string
  ): asserts value is T {
    if (value === null || value === undefined) {
      throw ValidationError.fromField(fieldName, `${fieldName} is required`);
    }
  }

  /**
   * Validates that a string is not empty
   */
  protected validateNotEmpty(value: string | null | undefined, fieldName: string): void {
    this.validateRequired(value, fieldName);
    if (value.trim() === '') {
      throw ValidationError.fromField(fieldName, `${fieldName} cannot be empty`);
    }
  }

  /**
   * Validates that a number is positive
   */
  protected validatePositive(value: number, fieldName: string): void {
    if (value <= 0) {
      throw ValidationError.fromField(fieldName, `${fieldName} must be positive`);
    }
  }

  /**
   * Validates that a number is non-negative
   */
  protected validateNonNegative(value: number, fieldName: string): void {
    if (value < 0) {
      throw ValidationError.fromField(fieldName, `${fieldName} must be non-negative`);
    }
  }

  /**
   * Validates that a value is within a range
   */
  protected validateRange(
    value: number,
    min: number,
    max: number,
    fieldName: string
  ): void {
    if (value < min || value > max) {
      throw ValidationError.fromField(
        fieldName,
        `${fieldName} must be between ${min} and ${max}`
      );
    }
  }

  /**
   * Validates that a string has a valid length
   */
  protected validateLength(
    value: string,
    minLength: number,
    maxLength: number,
    fieldName: string
  ): void {
    if (value.length < minLength || value.length > maxLength) {
      throw ValidationError.fromField(
        fieldName,
        `${fieldName} must be between ${minLength} and ${maxLength} characters`
      );
    }
  }

  /**
   * Validates that an email format is correct
   */
  protected validateEmail(email: string, fieldName: string = 'email'): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw ValidationError.fromField(fieldName, 'Invalid email format');
    }
  }

  /**
   * Validates that a user owns a resource
   */
  protected validateOwnership(
    resourceUserId: number,
    currentUserId: number,
    resourceType: string,
    resourceId: number
  ): void {
    if (resourceUserId !== currentUserId) {
      throw new BusinessLogicError(
        `Access denied: You don't own this ${resourceType}`,
        { resourceType, resourceId, expectedUserId: currentUserId, actualUserId: resourceUserId }
      );
    }
  }

  /**
   * Validates pagination parameters
   */
  protected validatePagination(page?: number, limit?: number): {
    validatedPage: number;
    validatedLimit: number;
    offset: number;
  } {
    const validatedPage = Math.max(1, page || 1);
    const validatedLimit = Math.min(100, Math.max(1, limit || 20));
    const offset = (validatedPage - 1) * validatedLimit;

    return {
      validatedPage,
      validatedLimit,
      offset,
    };
  }

  /**
   * Validates that a resource exists
   */
  protected validateResourceExists<T>(
    resource: T | null | undefined,
    resourceType: string,
    resourceId: string | number
  ): asserts resource is T {
    if (!resource) {
      throw new BusinessLogicError(
        `${resourceType} with ID ${resourceId} not found`,
        { resourceType, resourceId }
      );
    }
  }

  /**
   * Validates that resources exist
   */
  protected validateResourcesExist<T>(
    resources: T[],
    resourceType: string,
    expectedCount?: number
  ): void {
    if (resources.length === 0) {
      throw new BusinessLogicError(`No ${resourceType}s found`);
    }
    
    if (expectedCount && resources.length !== expectedCount) {
      throw new BusinessLogicError(
        `Expected ${expectedCount} ${resourceType}(s), found ${resources.length}`
      );
    }
  }

  /**
   * Creates a standardized error for business logic violations
   */
  protected createBusinessError(message: string, details?: any): BusinessLogicError {
    return new BusinessLogicError(message, details);
  }
}