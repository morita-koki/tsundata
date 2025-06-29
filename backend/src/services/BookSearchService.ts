/**
 * Book Search Service
 * Handles external API integration for book information retrieval
 * with retry logic, circuit breaker, and caching
 */

import axios from 'axios';
import { JSDOM } from 'jsdom';
import { BaseService } from './BaseService.js';
import { GoogleBooksApiService } from './GoogleBooksApiService.js';
import { ISBNService } from './ISBNService.js';
import type { RepositoryContainer } from '../repositories/index.js';
import type { ExternalBookData } from '../types/api.js';
import {
  ExternalApiError,
  NdlApiError,
  BookSearchError,
  InvalidIsbnError,
  ApiTimeoutError,
  ApiRateLimitError,
} from '../errors/index.js';
import { getApiConfiguration, type ExternalApiConfiguration } from '../config/externalApi.js';

interface CacheEntry {
  data: ExternalBookData;
  timestamp: number;
}

interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export class BookSearchService extends BaseService {
  private readonly config: ExternalApiConfiguration;
  private readonly cache: Map<string, CacheEntry> = new Map();
  private readonly circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly googleBooksService: GoogleBooksApiService;
  private readonly isbnService: ISBNService;

  constructor(repositories: RepositoryContainer) {
    super(repositories);
    this.config = getApiConfiguration();
    this.googleBooksService = new GoogleBooksApiService(repositories);
    this.isbnService = new ISBNService(repositories);
    
    // Initialize circuit breakers (only for NDL since Google Books has its own)
    this.circuitBreakers.set('ndl', {
      failureCount: 0,
      lastFailureTime: 0,
      state: 'CLOSED'
    });
  }

  /**
   * Searches for book information by ISBN using multiple APIs with caching
   */
  async searchByISBN(isbn: string): Promise<ExternalBookData> {
    // Enhanced ISBN validation with detailed analysis
    console.log(`📚 Starting book search for ISBN: ${isbn}`);
    
    const isbnInfo = this.isbnService.analyzeISBN(isbn);
    if (!isbnInfo.isValid) {
      const primaryError = isbnInfo.errors[0];
      throw new InvalidIsbnError(`${isbn}: ${primaryError?.message || 'Invalid ISBN format'}`);
    }
    
    // Use normalized ISBN for search
    const normalizedISBN = isbnInfo.isbn13 || isbnInfo.isbn10 || isbn;
    console.log(`🔍 Normalized ISBN: ${normalizedISBN} (${isbnInfo.region || 'Unknown region'})`);
    
    // Check cache first
    const cached = this.getFromCache(isbn);
    if (cached) {
      console.log('✅ Book found in cache:', cached.title);
      return cached;
    }
    
    const searchErrors: ExternalApiError[] = [];

    // Try NDL API first (especially for Japanese books)
    const isJapanese = isbnInfo.region === '日本';
    if (isJapanese) {
      console.log('🇯🇵 Japanese ISBN detected, prioritizing NDL API');
    }
    
    if (this.isCircuitBreakerClosed('ndl')) {
      try {
        console.log('🔍 Trying NDL API...');
        const bookData = await this.searchWithNDL(normalizedISBN);
        if (bookData) {
          console.log('✅ Book found via NDL API:', bookData.title);
          this.recordSuccess('ndl');
          this.putInCache(isbn, bookData);
          return bookData;
        }
        console.log('❌ NDL API returned no results');
      } catch (error) {
        console.log('❌ NDL API search failed:', (error as Error).message);
        this.recordFailure('ndl');
        searchErrors.push(error as ExternalApiError);
      }
    } else {
      console.log('⚡ NDL API circuit breaker is OPEN, skipping');
    }

    // Try Google Books API (with enhanced error handling)
    try {
      console.log('🔍 Trying Google Books API...');
      const bookData = await this.googleBooksService.searchByISBN(normalizedISBN);
      if (bookData) {
        console.log('✅ Book found via Google Books API:', bookData.title);
        this.putInCache(isbn, bookData);
        return bookData;
      }
      console.log('❌ Google Books API returned no results');
    } catch (error) {
      console.log('❌ Google Books API search failed:', (error as Error).message);
      searchErrors.push(error as ExternalApiError);
    }

    console.log('❌ No book found in any API');
    throw new BookSearchError(isbn, searchErrors);
  }

  /**
   * Cache management methods
   */
  private getFromCache(isbn: string): ExternalBookData | null {
    const entry = this.cache.get(isbn);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > this.config.cache.ttlMs) {
      this.cache.delete(isbn);
      return null;
    }
    
    return entry.data;
  }

  private putInCache(isbn: string, data: ExternalBookData): void {
    // Cleanup old entries if cache is full
    if (this.cache.size >= this.config.cache.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(isbn, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Circuit breaker methods (NDL only - Google Books handled separately)
   */
  private isCircuitBreakerClosed(apiName: string): boolean {
    const breaker = this.circuitBreakers.get(apiName);
    if (!breaker) return true;
    
    const now = Date.now();
    const config = this.config.ndl; // Only NDL uses this circuit breaker
    
    if (breaker.state === 'OPEN') {
      if (now - breaker.lastFailureTime > config.circuitBreakerResetTimeMs) {
        breaker.state = 'HALF_OPEN';
        console.log(`⚡ Circuit breaker for ${apiName} moved to HALF_OPEN`);
        return true;
      }
      return false;
    }
    
    return true;
  }

  private recordSuccess(apiName: string): void {
    const breaker = this.circuitBreakers.get(apiName);
    if (breaker) {
      breaker.failureCount = 0;
      breaker.state = 'CLOSED';
    }
  }

  private recordFailure(apiName: string): void {
    const breaker = this.circuitBreakers.get(apiName);
    if (!breaker) return;
    
    const config = this.config.ndl; // Only NDL uses circuit breaker here
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();
    
    if (breaker.failureCount >= config.circuitBreakerThreshold) {
      breaker.state = 'OPEN';
      console.log(`⚡ Circuit breaker for ${apiName} OPENED after ${breaker.failureCount} failures`);
    }
  }

  // ISBN validation methods moved to ISBNService

  /**
   * Searches using NDL (National Diet Library) API with retry logic
   */
  private async searchWithNDL(isbn: string): Promise<ExternalBookData | null> {
    console.log(`📖 NDL API search for ISBN: ${isbn}`);
    
    return this.makeRequestWithRetry(
      async () => {
        const response = await axios.get(this.config.ndl.baseUrl, {
          params: {
            ...this.config.ndl.defaultParams,
            query: `isbn="${isbn}" AND dpid=iss-ndl-opac`,
          },
          timeout: this.config.ndl.timeout,
        });

        console.log(`📊 NDL API response status: ${response.status}`);

        if (response.status !== 200) {
          throw new NdlApiError(`NDL API returned status ${response.status}`);
        }

        return this.parseNDLResponse(response.data, isbn);
      },
      this.config.ndl,
      'NDL API'
    );
  }

  // Google Books API method removed - now handled by GoogleBooksApiService

  /**
   * Makes requests with exponential backoff retry logic
   */
  private async makeRequestWithRetry<T>(
    requestFn: () => Promise<T>,
    apiConfig: { retryAttempts: number; retryDelayMs: number; maxRetryDelayMs: number },
    apiName: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= apiConfig.retryAttempts; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;
        
        if (error.code === 'ECONNABORTED') {
          const timeoutError = new ApiTimeoutError(apiName, '', 0);
          if (attempt === apiConfig.retryAttempts) {
            throw timeoutError;
          }
          console.log(`⏰ ${apiName} timeout, retrying... (attempt ${attempt + 1}/${apiConfig.retryAttempts})`);
        } else if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const rateLimitError = new ApiRateLimitError(apiName, retryAfter ? parseInt(retryAfter) : undefined);
          if (attempt === apiConfig.retryAttempts) {
            throw rateLimitError;
          }
          console.log(`🚫 ${apiName} rate limited, retrying... (attempt ${attempt + 1}/${apiConfig.retryAttempts})`);
        } else if (error.response?.status >= 500) {
          // Retry on server errors
          if (attempt === apiConfig.retryAttempts) {
            throw new ExternalApiError(apiName, `Request failed: ${error.message}`, '', error);
          }
          console.log(`🔄 ${apiName} server error, retrying... (attempt ${attempt + 1}/${apiConfig.retryAttempts})`);
        } else {
          // Don't retry on client errors (4xx)
          throw new ExternalApiError(apiName, `Request failed: ${error.message}`, '', error);
        }
        
        if (attempt < apiConfig.retryAttempts) {
          // Exponential backoff with jitter
          const baseDelay = apiConfig.retryDelayMs * Math.pow(2, attempt);
          const jitter = Math.random() * 0.1 * baseDelay;
          const delay = Math.min(baseDelay + jitter, apiConfig.maxRetryDelayMs);
          
          console.log(`⏳ Waiting ${Math.round(delay)}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError || new ExternalApiError(apiName, 'Request failed after retries', '');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parses NDL API XML response with enhanced Japanese text processing
   */
  private parseNDLResponse(xmlData: string, isbn: string): ExternalBookData | null {
    try {
      const dom = new JSDOM(xmlData, { contentType: 'text/xml' });
      const doc = dom.window.document;

      const records = doc.getElementsByTagName('recordData');
      console.log(`📚 NDL API found ${records.length} records`);
      
      if (records.length === 0) {
        return null;
      }

      const record = records[0];
      if (!record) {
        return null;
      }
      
      // Log available elements for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 First record content:', record.innerHTML.substring(0, 500) + '...');
        const allElements = record.getElementsByTagName('*');
        console.log('🔍 Available elements in record:');
        for (let i = 0; i < Math.min(allElements.length, 20); i++) {
          const element = allElements[i];
          if (element && element.textContent && element.textContent.trim()) {
            console.log(`  - ${element.tagName}: "${element.textContent.substring(0, 50)}${element.textContent.length > 50 ? '...' : ''}"`);
          }
        }
      }
      
      // Extract book information using multiple element name variations
      const title = this.getElementTextWithFallbacks(record, ['dcterms:title', 'dc:title']);
      const creator = this.getElementTextWithFallbacks(record, ['dc:creator', 'dcterms:creator']);
      const publisher = this.getElementTextWithFallbacks(record, ['dc:publisher', 'dcterms:publisher']);
      const date = this.getElementTextWithFallbacks(record, ['dcterms:issued', 'dc:date']);
      const description = this.getElementTextWithFallbacks(record, ['dcndl:description', 'dc:description', 'dcterms:abstract']);
      const extent = this.getElementTextWithFallbacks(record, ['dcterms:extent', 'dc:extent']);
      const priceInfo = this.getElementTextWithFallbacks(record, ['dcndl:price', 'dc:price']);
      const series = this.getElementTextWithFallbacks(record, ['dcndl:series', 'dcterms:isPartOf', 'dc:relation']);

      // Clean and process title (remove furigana/reading)
      let cleanTitle: string | null = title;
      if (title) {
        cleanTitle = title.split('\n')[0]?.trim() || title;
      }

      console.log(`📖 NDL parsed data: title="${cleanTitle || 'null'}", author="${creator || 'null'}", publisher="${publisher || 'null'}", price="${priceInfo || 'null'}", series="${series || 'null'}"`);

      // Enhanced publisher processing for Japanese publishers
      let actualPublisher = this.processJapanesePublisher(record, publisher);
      
      // Extract page count from extent
      let pageCount: number | undefined;
      if (extent) {
        const pageMatch = extent.match(/(\d+)p/);
        if (pageMatch && pageMatch[1]) {
          pageCount = parseInt(pageMatch[1], 10);
        }
      }

      // Extract price (remove yen symbol and text)
      let price: number | undefined;
      if (priceInfo) {
        const priceMatch = priceInfo.match(/(\d+)/);
        if (priceMatch && priceMatch[1]) {
          price = parseInt(priceMatch[1], 10);
        }
        console.log(`💰 Price extracted: "${priceInfo}" -> ${price}`);
      }

      // Validate required fields
      if (!cleanTitle || cleanTitle.trim() === '' || cleanTitle === 'Unknown Title') {
        console.log('❌ NDL API: Title is missing or unknown');
        return null;
      }

      if (!creator || creator.trim() === '' || creator === 'Unknown Author') {
        console.log('❌ NDL API: Author is missing or unknown');
        return null;
      }

      const bookData: ExternalBookData = {
        isbn,
        title: this.cleanText(cleanTitle),
        author: this.cleanText(creator),
      };

      // Add optional properties only if they exist
      if (actualPublisher) {
        bookData.publisher = this.cleanText(actualPublisher);
      }
      if (date) {
        bookData.publishedDate = this.formatDate(date);
      }
      if (description) {
        bookData.description = this.cleanText(description);
      }
      if (pageCount !== undefined) {
        bookData.pageCount = pageCount;
      }
      if (price !== undefined) {
        bookData.price = price;
      }
      if (series) {
        bookData.series = this.cleanText(series);
      }

      console.log(`✅ NDL final book data:`, bookData);
      return bookData;
    } catch (error) {
      throw new NdlApiError('Failed to parse NDL API response', undefined, error as Error);
    }
  }

  // Google Books parsing moved to GoogleBooksApiService


  /**
   * Enhanced element text extraction with multiple fallback tag names
   */
  private getElementTextWithFallbacks(record: Element, tagNames: string[]): string | null {
    for (const tagName of tagNames) {
      const elements = record.getElementsByTagName(tagName);
      if (elements.length > 0) {
        const element = elements[0];
        if (element && element.textContent) {
          const text = element.textContent.trim();
          if (text) {
            console.log(`✅ Found element: ${tagName} = "${text}"`);
            return text;
          }
        }
      }
    }
    
    console.log(`❌ Could not find any of: ${tagNames.join(', ')}`);
    return null;
  }

  /**
   * Advanced Japanese publisher processing
   */
  private processJapanesePublisher(record: Element, initialPublisher: string | null): string | null {
    let actualPublisher = initialPublisher;
    console.log(`🔍 Initial publisher: "${actualPublisher}"`);
    
    if (!actualPublisher || actualPublisher === 'JP') {
      // Try additional publisher element candidates
      const publisherCandidates = ['dc:publisher', 'dcndl:publisher', 'dcterms:publisher'];
      
      for (const candidate of publisherCandidates) {
        const candidateValue = this.getElementTextWithFallbacks(record, [candidate]);
        console.log(`🔍 Trying ${candidate}: "${candidateValue}"`);
        if (candidateValue && candidateValue !== 'JP') {
          actualPublisher = candidateValue;
          break;
        }
      }
      
      // Search all elements for publisher-like content
      if (!actualPublisher || actualPublisher === 'JP') {
        console.log('🔍 Publisher not found in standard elements, checking all available elements...');
        const allElements = record.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i];
          const content = element?.textContent;
          
          // Look for content that contains publisher-like keywords
          if (content && (content.includes('書房') || content.includes('出版') || content.includes('社'))) {
            console.log(`🎯 Found potential publisher in ${element.tagName}: "${content}"`);
            actualPublisher = content;
            break;
          }
        }
      }
    }

    // Clean up publisher name using shared cleaning logic
    const cleanPublisher = this.cleanJapanesePublisher(actualPublisher);
    console.log(`🏢 Publisher cleaned: "${actualPublisher}" -> "${cleanPublisher}"`);
    return cleanPublisher;
  }


  /**
   * Shared Japanese publisher cleaning logic
   */
  private cleanJapanesePublisher(rawPublisher: string | null | undefined): string | null {
    if (!rawPublisher) return null;
    
    const firstLine = rawPublisher.split('\n')[0];
    if (!firstLine) return null;
    
    const firstPart = firstLine.trim().split(/\s+/)[0];
    if (!firstPart) return null;
    
    let cleanPublisher = firstPart
      .replace(/[ア-ン\s]+/g, '') // Remove katakana furigana and spaces
      .replace(/東京|大阪|京都|名古屋|福岡|札幌|仙台|広島|神戸|横浜|愛知|兵庫|千葉|埼玉|神奈川/g, '') // Remove prefecture names
      .replace(/区|市|町|村|都|府|県/g, '') // Remove administrative divisions
      .replace(/株式会社|有限会社|合同会社|合資会社|合名会社/g, '') // Remove company types
      .replace(/[0-9\-]/g, '') // Remove numbers and hyphens
      .trim();
    
    // If cleaning resulted in empty string, use first meaningful part
    if (!cleanPublisher && rawPublisher) {
      const parts = rawPublisher.split(/[\s\n]+/);
      const meaningfulPart = parts.find(part => part.length > 1 && !/^[ア-ン]+$/.test(part));
      cleanPublisher = meaningfulPart || parts[0] || '';
    }
    
    return cleanPublisher || null;
  }

  /**
   * Cleans and normalizes text content
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]/g, ' ')
      .trim();
  }

  /**
   * Formats date strings to a consistent format
   */
  private formatDate(dateString: string): string {
    // Try to parse and format the date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original if parsing fails
    }
    return date.toISOString().split('T')[0] as string; // Return YYYY-MM-DD format
  }

  /**
   * Cache management utilities
   */
  public getCacheStats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.cache.maxEntries,
      ttlMs: this.config.cache.ttlMs
    };
  }

  public clearCache(): void {
    this.cache.clear();
    console.log('📭 Book search cache cleared');
  }

  public cleanExpiredCacheEntries(): number {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.cache.ttlMs) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Removed ${removedCount} expired cache entries`);
    }
    
    return removedCount;
  }

  /**
   * Circuit breaker utilities
   */
  public getCircuitBreakerStats(): Record<string, CircuitBreakerState> {
    const stats: Record<string, CircuitBreakerState> = {};
    for (const [name, state] of this.circuitBreakers.entries()) {
      stats[name] = { ...state };
    }
    return stats;
  }

  public resetCircuitBreaker(apiName: string): void {
    const breaker = this.circuitBreakers.get(apiName);
    if (breaker) {
      breaker.failureCount = 0;
      breaker.state = 'CLOSED';
      console.log(`🔄 Circuit breaker for ${apiName} has been reset`);
    }
  }

  /**
   * Google Books API monitoring methods
   */
  public getGoogleBooksHealth(): any {
    return this.googleBooksService.getHealthStatus();
  }

  public getGoogleBooksQuotaInfo(): any {
    return this.googleBooksService.getQuotaInfo();
  }

  public resetGoogleBooksQuota(): void {
    this.googleBooksService.resetQuotaCounters();
  }

  /**
   * ISBN関連のユーティリティメソッド
   */
  public analyzeISBN(isbn: string) {
    return this.isbnService.analyzeISBN(isbn);
  }

  public validateISBN(isbn: string): void {
    return this.isbnService.validateISBN(isbn);
  }

  public isJapaneseISBN(isbn: string): boolean {
    return this.isbnService.isJapaneseISBN(isbn);
  }

  public convertToISBN13(isbn10: string): string {
    return this.isbnService.convertToISBN13(isbn10);
  }

  public convertToISBN10(isbn13: string): string {
    return this.isbnService.convertToISBN10(isbn13);
  }

  public extractISBNFromBarcode(barcode: string) {
    return this.isbnService.extractISBNFromBarcode(barcode);
  }

  public debugISBN(isbn: string): void {
    return this.isbnService.debugISBN(isbn);
  }
}