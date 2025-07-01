/**
 * External API Configuration
 * Centralized configuration for external book search APIs
 */

export interface ApiConfig {
  timeout: number;
  retryAttempts: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetTimeMs: number;
}

export interface NDLApiConfig extends ApiConfig {
  baseUrl: string;
  defaultParams: {
    operation: string;
    version: string;
    recordSchema: string;
    onlyBib: string;
    recordPacking: string;
    maximumRecords: number;
  };
}

export interface GoogleBooksApiConfig extends ApiConfig {
  baseUrl: string;
  apiKey: string | undefined;
  defaultParams: {
    maxResults: number;
  };
}

export interface ExternalApiConfiguration {
  ndl: NDLApiConfig;
  googleBooks: GoogleBooksApiConfig;
  cache: {
    ttlMs: number;
    maxEntries: number;
  };
}

export const createDefaultApiConfig = (): ExternalApiConfiguration => ({
  ndl: {
    baseUrl: 'https://iss.ndl.go.jp/api/sru',
    timeout: 15000, // 15 seconds for NDL (slower than Google Books)
    retryAttempts: 3,
    retryDelayMs: 1000,
    maxRetryDelayMs: 8000,
    circuitBreakerThreshold: 5,
    circuitBreakerResetTimeMs: 60000, // 1 minute
    defaultParams: {
      operation: 'searchRetrieve',
      version: '1.2',
      recordSchema: 'dcndl',
      onlyBib: 'true',
      recordPacking: 'xml',
      maximumRecords: 1,
    },
  },
  googleBooks: {
    baseUrl: 'https://www.googleapis.com/books/v1/volumes',
    apiKey: process.env.GOOGLE_BOOKS_API_KEY,
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelayMs: 500,
    maxRetryDelayMs: 4000,
    circuitBreakerThreshold: 5,
    circuitBreakerResetTimeMs: 60000, // 1 minute
    defaultParams: {
      maxResults: 1,
    },
  },
  cache: {
    ttlMs: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 1000,
  },
});

// Environment-specific configuration overrides
export const getApiConfiguration = (): ExternalApiConfiguration => {
  const config = createDefaultApiConfig();

  // Override with environment variables if available
  if (process.env.NDL_API_TIMEOUT) {
    config.ndl.timeout = parseInt(process.env.NDL_API_TIMEOUT);
  }

  if (process.env.GOOGLE_BOOKS_API_TIMEOUT) {
    config.googleBooks.timeout = parseInt(process.env.GOOGLE_BOOKS_API_TIMEOUT);
  }

  if (process.env.API_RETRY_ATTEMPTS) {
    const retryAttempts = parseInt(process.env.API_RETRY_ATTEMPTS);
    config.ndl.retryAttempts = retryAttempts;
    config.googleBooks.retryAttempts = retryAttempts;
  }

  if (process.env.BOOK_CACHE_TTL_HOURS) {
    config.cache.ttlMs = parseInt(process.env.BOOK_CACHE_TTL_HOURS) * 60 * 60 * 1000;
  }

  return config;
};