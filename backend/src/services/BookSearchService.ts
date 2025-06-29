/**
 * Book Search Service
 * Handles external API integration for book information retrieval
 */

import axios from 'axios';
import { JSDOM } from 'jsdom';
import { BaseService } from './BaseService.js';
import type { RepositoryContainer } from '../repositories/index.js';
import type { ExternalBookData } from '../types/api.js';
import {
  ExternalApiError,
  GoogleBooksApiError,
  NdlApiError,
  BookSearchError,
  InvalidIsbnError,
  ApiTimeoutError,
  ApiRateLimitError,
} from '../errors/index.js';

export class BookSearchService extends BaseService {
  private readonly GOOGLE_BOOKS_API_KEY: string;
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds

  constructor(repositories: RepositoryContainer) {
    super(repositories);
    
    this.GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || '';
    if (!this.GOOGLE_BOOKS_API_KEY) {
      console.warn('Google Books API key not configured');
    }
  }

  /**
   * Searches for book information by ISBN using multiple APIs
   */
  async searchByISBN(isbn: string): Promise<ExternalBookData> {
    // Validate ISBN format
    this.validateISBN(isbn);

    console.log(`📚 Starting book search for ISBN: ${isbn}`);
    
    const searchErrors: ExternalApiError[] = [];

    // Try NDL API first (for Japanese books)
    try {
      console.log('🔍 Trying NDL API...');
      const bookData = await this.searchWithNDL(isbn);
      if (bookData) {
        console.log('✅ Book found via NDL API:', bookData.title);
        return bookData;
      }
      console.log('❌ NDL API returned no results');
    } catch (error) {
      console.log('❌ NDL API search failed:', (error as Error).message);
      searchErrors.push(error as ExternalApiError);
    }

    // Try Google Books API
    try {
      console.log('🔍 Trying Google Books API...');
      const bookData = await this.searchWithGoogleBooks(isbn);
      if (bookData) {
        console.log('✅ Book found via Google Books API:', bookData.title);
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
   * Validates ISBN format
   */
  private validateISBN(isbn: string): void {
    // Remove hyphens and spaces
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    // Check length
    if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
      throw new InvalidIsbnError(isbn);
    }
    
    // Check if all characters are digits (except last character in ISBN-10 can be X)
    if (cleanISBN.length === 10) {
      if (!/^\d{9}[\dX]$/i.test(cleanISBN)) {
        throw new InvalidIsbnError(isbn);
      }
    } else {
      if (!/^\d{13}$/.test(cleanISBN)) {
        throw new InvalidIsbnError(isbn);
      }
    }
  }

  /**
   * Searches using NDL (National Diet Library) API
   */
  private async searchWithNDL(isbn: string): Promise<ExternalBookData | null> {
    try {
      console.log(`📖 NDL API search for ISBN: ${isbn}`);
      
      const response = await this.makeRequest(
        'https://iss.ndl.go.jp/api/sru',
        {
          params: {
            operation: 'searchRetrieve',
            version: '1.2',
            recordSchema: 'dcndl',
            onlyBib: 'true',
            recordPacking: 'xml',
            query: `isbn="${isbn}" AND dpid=iss-ndl-opac`,
            maximumRecords: 1,
          },
        },
        'NDL API'
      );

      console.log(`📊 NDL API response status: ${response.status}`);

      if (response.status !== 200) {
        throw new NdlApiError(`NDL API returned status ${response.status}`);
      }

      return this.parseNDLResponse(response.data, isbn);
    } catch (error) {
      if (error instanceof ExternalApiError) {
        throw error;
      }
      throw new NdlApiError('NDL API request failed', undefined, error as Error);
    }
  }

  /**
   * Searches using Google Books API
   */
  private async searchWithGoogleBooks(isbn: string): Promise<ExternalBookData | null> {
    try {
      console.log(`📖 Google Books API search for ISBN: ${isbn}`);

      if (!this.GOOGLE_BOOKS_API_KEY) {
        throw new GoogleBooksApiError('Google Books API key not configured');
      }

      const response = await this.makeRequest(
        'https://www.googleapis.com/books/v1/volumes',
        {
          params: {
            q: `isbn:${isbn}`,
            key: this.GOOGLE_BOOKS_API_KEY,
            maxResults: 1,
          },
        },
        'Google Books API'
      );

      console.log(`📊 Google Books API response status: ${response.status}`);

      if (response.status !== 200) {
        throw new GoogleBooksApiError(`Google Books API returned status ${response.status}`);
      }

      return this.parseGoogleBooksResponse(response.data, isbn);
    } catch (error) {
      if (error instanceof ExternalApiError) {
        throw error;
      }
      throw new GoogleBooksApiError('Google Books API request failed', undefined, error as Error);
    }
  }

  /**
   * Makes an HTTP request with timeout and error handling
   */
  private async makeRequest(
    url: string,
    config: any,
    apiName: string
  ): Promise<any> {
    try {
      const response = await axios.get(url, {
        ...config,
        timeout: this.REQUEST_TIMEOUT,
      });
      return response;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new ApiTimeoutError(apiName, url, this.REQUEST_TIMEOUT);
      }

      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        throw new ApiRateLimitError(apiName, retryAfter ? parseInt(retryAfter) : undefined, url);
      }

      throw new ExternalApiError(
        apiName,
        `Request failed: ${error.message}`,
        url,
        error
      );
    }
  }

  /**
   * Parses NDL API XML response
   */
  private parseNDLResponse(xmlData: string, isbn: string): ExternalBookData | null {
    try {
      const dom = new JSDOM(xmlData, { contentType: 'text/xml' });
      const doc = dom.window.document;

      const records = doc.querySelectorAll('record');
      if (records.length === 0) {
        return null;
      }

      const record = records[0];
      if (!record) {
        return null;
      }
      
      // Extract book information from XML
      const titleEl = record.querySelector('dc\\:title, title');
      const creatorEl = record.querySelector('dc\\:creator, creator');
      const publisherEl = record.querySelector('dc\\:publisher, publisher');
      const dateEl = record.querySelector('dc\\:date, date');
      const descriptionEl = record.querySelector('dc\\:description, description');
      
      const title = this.getTextContentFromElement(titleEl) || 'Unknown Title';
      const creator = this.getTextContentFromElement(creatorEl) || 'Unknown Author';
      const publisher = this.getTextContentFromElement(publisherEl);
      const date = this.getTextContentFromElement(dateEl);
      const description = this.getTextContentFromElement(descriptionEl);

      return {
        isbn,
        title: this.cleanText(title),
        author: this.cleanText(creator),
        publisher: publisher ? this.cleanText(publisher) : undefined,
        publishedDate: date ? this.formatDate(date) : undefined,
        description: description ? this.cleanText(description) : undefined,
      } as ExternalBookData;
    } catch (error) {
      throw new NdlApiError('Failed to parse NDL API response', undefined, error as Error);
    }
  }

  /**
   * Parses Google Books API JSON response
   */
  private parseGoogleBooksResponse(data: any, isbn: string): ExternalBookData | null {
    try {
      if (!data.items || data.items.length === 0) {
        return null;
      }

      const item = data.items[0];
      const volumeInfo = item.volumeInfo || {};
      const saleInfo = item.saleInfo || {};

      const authors = volumeInfo.authors;
      const authorString = Array.isArray(authors) ? authors.join(', ') : 'Unknown Author';

      return {
        isbn,
        title: volumeInfo.title || 'Unknown Title',
        author: authorString,
        publisher: volumeInfo.publisher,
        publishedDate: volumeInfo.publishedDate,
        description: volumeInfo.description,
        pageCount: volumeInfo.pageCount,
        thumbnail: volumeInfo.imageLinks?.thumbnail,
        price: saleInfo.listPrice?.amount,
        series: volumeInfo.series,
      };
    } catch (error) {
      throw new GoogleBooksApiError('Failed to parse Google Books API response', undefined, error as Error);
    }
  }


  /**
   * Helper method to get text content from element
   */
  private getTextContentFromElement(element: Element | null): string | null {
    return element ? element.textContent?.trim() || null : null;
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
}