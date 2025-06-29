/**
 * Google Books API Service
 * Enhanced error handling and monitoring for Google Books API interactions
 */

import axios, { AxiosError } from 'axios';
import { BaseService } from './BaseService.js';
import type { RepositoryContainer } from '../repositories/index.js';
import type { ExternalBookData } from '../types/api.js';
import {
  GoogleBooksApiError,
  ApiRateLimitError,
} from '../errors/index.js';
import { HttpStatusCode } from '../types/common.js';
import { getApiConfiguration, type GoogleBooksApiConfig } from '../config/externalApi.js';

interface GoogleBooksErrorDetails {
  code: number;
  message: string;
  errors?: Array<{
    domain: string;
    reason: string;
    message: string;
  }>;
}

interface GoogleBooksErrorResponse {
  error: GoogleBooksErrorDetails;
}

interface ApiQuotaInfo {
  dailyQuotaExceeded: boolean;
  perUserQuotaExceeded: boolean;
  lastQuotaResetTime: number;
  requestsToday: number;
}

export class GoogleBooksApiService extends BaseService {
  private readonly config: GoogleBooksApiConfig;
  private quotaInfo: ApiQuotaInfo;
  private readonly axiosInstance;

  constructor(repositories: RepositoryContainer) {
    super(repositories);
    this.config = getApiConfiguration().googleBooks;
    
    this.quotaInfo = {
      dailyQuotaExceeded: false,
      perUserQuotaExceeded: false,
      lastQuotaResetTime: this.getTodayMidnight(),
      requestsToday: 0,
    };

    // Create configured axios instance
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'Bookshelf-App/1.0',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor for monitoring
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.incrementRequestCount();
        console.log(`📡 Google Books API request: ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`✅ Google Books API response: ${response.status}`);
        return response;
      },
      (error) => this.handleAxiosError(error)
    );
  }

  /**
   * Search for book by ISBN with enhanced error handling
   */
  async searchByISBN(isbn: string): Promise<ExternalBookData | null> {
    if (!this.config.apiKey) {
      throw new GoogleBooksApiError('Google Books API key not configured');
    }

    if (this.isQuotaExceeded()) {
      throw new GoogleBooksApiError('Google Books API quota exceeded for today');
    }

    try {
      const response = await this.makeRequestWithRetry(async () => {
        return await this.axiosInstance.get('', {
          params: {
            q: `isbn:${isbn}`,
            key: this.config.apiKey,
            ...this.config.defaultParams,
          },
        });
      });

      return this.parseResponse(response.data, isbn);
    } catch (error) {
      if (error instanceof GoogleBooksApiError) {
        this.handleSpecificGoogleBooksError(error);
      }
      throw error;
    }
  }

  /**
   * Handle Google Books API specific errors with enhanced logic
   */
  private handleAxiosError(error: AxiosError): Promise<never> {
    const response = error.response;
    
    if (!response) {
      // Network error
      return Promise.reject(new GoogleBooksApiError(
        `Network error: ${error.message}`,
        undefined,
        error
      ));
    }

    const status = response.status;
    const errorData = response.data as GoogleBooksErrorResponse;
    
    console.log(`❌ Google Books API error: ${status}`, errorData);

    switch (status) {
      case 400:
        return this.handle400Error(errorData, error);
      case 401:
        return this.handle401Error(errorData, error);
      case 403:
        return this.handle403Error(errorData, error);
      case 429:
        return this.handle429Error(response.headers, error);
      case 500:
      case 502:
      case 503:
      case 504:
        return this.handleServerError(status, errorData, error);
      default:
        return Promise.reject(new GoogleBooksApiError(
          `HTTP ${status}: ${errorData?.error?.message || 'Unknown error'}`,
          HttpStatusCode.SERVICE_UNAVAILABLE,
          error
        ));
    }
  }

  private handle400Error(errorData: GoogleBooksErrorResponse, originalError: AxiosError): Promise<never> {
    const errorDetail = errorData?.error;
    const reason = errorDetail?.errors?.[0]?.reason;
    
    let message = 'Bad request to Google Books API';
    if (reason === 'invalid') {
      message = 'Invalid search parameters provided to Google Books API';
    } else if (errorDetail?.message) {
      message = errorDetail.message;
    }

    return Promise.reject(new GoogleBooksApiError(message, HttpStatusCode.BAD_REQUEST, originalError));
  }

  private handle401Error(_errorData: GoogleBooksErrorResponse, originalError: AxiosError): Promise<never> {
    const message = 'Google Books API key is invalid or expired';
    console.error('🔑 Google Books API authentication failed - check API key');
    
    return Promise.reject(new GoogleBooksApiError(message, HttpStatusCode.UNAUTHORIZED, originalError));
  }

  private handle403Error(errorData: GoogleBooksErrorResponse, originalError: AxiosError): Promise<never> {
    const errorDetail = errorData?.error;
    const reason = errorDetail?.errors?.[0]?.reason;
    
    if (reason === 'dailyLimitExceeded') {
      this.quotaInfo.dailyQuotaExceeded = true;
      console.error('📊 Google Books API daily quota exceeded');
      return Promise.reject(new GoogleBooksApiError(
        'Google Books API daily quota exceeded',
        HttpStatusCode.FORBIDDEN,
        originalError
      ));
    } else if (reason === 'userRateLimitExceeded') {
      this.quotaInfo.perUserQuotaExceeded = true;
      console.error('🚦 Google Books API user rate limit exceeded');
      return Promise.reject(new ApiRateLimitError(
        'Google Books API',
        60 // Default retry after 60 seconds
      ));
    } else if (reason === 'quotaExceeded') {
      this.quotaInfo.dailyQuotaExceeded = true;
      console.error('💳 Google Books API quota exceeded');
      return Promise.reject(new GoogleBooksApiError(
        'Google Books API quota exceeded',
        HttpStatusCode.FORBIDDEN,
        originalError
      ));
    }

    return Promise.reject(new GoogleBooksApiError(
      errorDetail?.message || 'Forbidden - insufficient permissions',
      HttpStatusCode.FORBIDDEN,
      originalError
    ));
  }

  private handle429Error(headers: any, _originalError: AxiosError): Promise<never> {
    const retryAfter = headers['retry-after'] ? parseInt(headers['retry-after']) : 60;
    console.log(`⏰ Google Books API rate limited, retry after ${retryAfter} seconds`);
    
    return Promise.reject(new ApiRateLimitError('Google Books API', retryAfter));
  }

  private handleServerError(status: number, _errorData: GoogleBooksErrorResponse, originalError: AxiosError): Promise<never> {
    const message = `Google Books API server error (${status}): Server temporarily unavailable`;
    console.error(`🚨 ${message}`);
    
    const statusCode = status >= 500 ? HttpStatusCode.SERVICE_UNAVAILABLE : HttpStatusCode.INTERNAL_SERVER_ERROR;
    return Promise.reject(new GoogleBooksApiError(message, statusCode, originalError));
  }

  /**
   * Handle specific Google Books errors for monitoring and alerting
   */
  private handleSpecificGoogleBooksError(error: GoogleBooksApiError): void {
    const errorCode = error.statusCode;
    
    // Log for monitoring systems
    if (errorCode === HttpStatusCode.FORBIDDEN) {
      console.warn('🔔 ALERT: Google Books API quota issues detected');
      // Could integrate with monitoring systems here
    } else if (errorCode === HttpStatusCode.UNAUTHORIZED) {
      console.error('🔔 CRITICAL: Google Books API authentication failure');
      // Could send alerts to administrators
    } else if (errorCode && errorCode >= 500) {
      console.warn('🔔 WARNING: Google Books API server issues detected');
      // Could trigger service health checks
    }
  }

  /**
   * Enhanced request retry logic for Google Books API
   */
  private async makeRequestWithRetry(requestFn: () => Promise<any>): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error instanceof GoogleBooksApiError) {
          const statusCode = error.statusCode;
          if (statusCode === HttpStatusCode.UNAUTHORIZED || 
              statusCode === HttpStatusCode.BAD_REQUEST || 
              (statusCode === HttpStatusCode.FORBIDDEN && this.quotaInfo.dailyQuotaExceeded)) {
            throw error; // Don't retry auth failures or quota exceeded
          }
        }
        
        if (attempt === this.config.retryAttempts) {
          throw error;
        }
        
        // Calculate retry delay with exponential backoff
        const baseDelay = this.config.retryDelayMs * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * baseDelay;
        const delay = Math.min(baseDelay + jitter, this.config.maxRetryDelayMs);
        
        console.log(`⏳ Retrying Google Books API request in ${Math.round(delay)}ms (attempt ${attempt + 1}/${this.config.retryAttempts})`);
        await this.sleep(delay);
      }
    }
    
    throw lastError || new GoogleBooksApiError('Request failed after retries');
  }

  /**
   * Parse Google Books API response
   */
  private parseResponse(data: any, isbn: string): ExternalBookData | null {
    console.log(`📊 Google Books API response: ${data.totalItems} items found`);
    
    if (!data.items || data.items.length === 0) {
      return null;
    }

    const item = data.items[0];
    const volumeInfo = item.volumeInfo || {};
    const saleInfo = item.saleInfo || {};

    const title = volumeInfo.title;
    const authors = volumeInfo.authors;
    
    if (!title || !authors || authors.length === 0) {
      console.log('❌ Google Books API: Missing required fields (title or authors)');
      return null;
    }

    const authorString = Array.isArray(authors) ? authors.join(', ') : authors;

    return {
      isbn,
      title: title.trim(),
      author: authorString.trim(),
      publisher: volumeInfo.publisher?.trim() || undefined,
      publishedDate: volumeInfo.publishedDate || undefined,
      description: volumeInfo.description?.trim() || undefined,
      pageCount: volumeInfo.pageCount || undefined,
      thumbnail: volumeInfo.imageLinks?.thumbnail || undefined,
      price: saleInfo.listPrice?.amount || undefined,
      series: volumeInfo.series?.trim() || undefined,
    };
  }

  /**
   * Quota management methods
   */
  private isQuotaExceeded(): boolean {
    this.resetQuotaIfNewDay();
    return this.quotaInfo.dailyQuotaExceeded;
  }

  private incrementRequestCount(): void {
    this.resetQuotaIfNewDay();
    this.quotaInfo.requestsToday++;
  }

  private resetQuotaIfNewDay(): void {
    const todayMidnight = this.getTodayMidnight();
    if (this.quotaInfo.lastQuotaResetTime < todayMidnight) {
      this.quotaInfo.dailyQuotaExceeded = false;
      this.quotaInfo.perUserQuotaExceeded = false;
      this.quotaInfo.requestsToday = 0;
      this.quotaInfo.lastQuotaResetTime = todayMidnight;
      console.log('🔄 Google Books API quota counters reset for new day');
    }
  }

  private getTodayMidnight(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Monitoring and debugging methods
   */
  public getQuotaInfo(): ApiQuotaInfo {
    this.resetQuotaIfNewDay();
    return { ...this.quotaInfo };
  }

  public resetQuotaCounters(): void {
    this.quotaInfo.dailyQuotaExceeded = false;
    this.quotaInfo.perUserQuotaExceeded = false;
    this.quotaInfo.requestsToday = 0;
    console.log('🔄 Google Books API quota counters manually reset');
  }

  public isHealthy(): boolean {
    return !this.isQuotaExceeded() && !!this.config.apiKey;
  }

  public getHealthStatus(): { 
    healthy: boolean; 
    quotaExceeded: boolean; 
    apiKeyConfigured: boolean; 
    requestsToday: number; 
  } {
    return {
      healthy: this.isHealthy(),
      quotaExceeded: this.isQuotaExceeded(),
      apiKeyConfigured: !!this.config.apiKey,
      requestsToday: this.quotaInfo.requestsToday,
    };
  }
}