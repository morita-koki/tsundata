/**
 * テストヘルパー関数
 * テスト実行時に共通で使用されるユーティリティ関数
 */

import { jest } from '@jest/globals';
import supertest from 'supertest';
import { testUsers, testBooks, testUserBooks, testBookshelves } from '../fixtures/testData.js';
import { resetAllMocks } from '../mocks/externalApi.js';

/**
 * テスト用Express アプリケーション作成
 */
export async function createTestApp() {
  // 簡易テスト用Expressアプリケーション
  const express = await import('express');
  const app = express.default();
  
  // テスト用の基本ミドルウェア
  app.use(express.default.json());
  
  // テスト用ヘルスチェックエンドポイント
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  return app;
}

/**
 * 認証付きリクエストヘルパー
 */
export class AuthenticatedRequest {
  private app: any;
  private token: string;

  constructor(app: any, token: string = 'valid-token') {
    this.app = app;
    this.token = token;
  }

  get(url: string) {
    return supertest(this.app)
      .get(url)
      .set('Authorization', `Bearer ${this.token}`);
  }

  post(url: string, data?: any) {
    const request = supertest(this.app)
      .post(url)
      .set('Authorization', `Bearer ${this.token}`);
    
    if (data) {
      request.send(data);
    }
    
    return request;
  }

  put(url: string, data?: any) {
    const request = supertest(this.app)
      .put(url)
      .set('Authorization', `Bearer ${this.token}`);
    
    if (data) {
      request.send(data);
    }
    
    return request;
  }

  delete(url: string) {
    return supertest(this.app)
      .delete(url)
      .set('Authorization', `Bearer ${this.token}`);
  }
}

/**
 * 認証なしリクエストヘルパー
 */
export class PublicRequest {
  private app: any;

  constructor(app: any) {
    this.app = app;
  }

  get(url: string) {
    return supertest(this.app).get(url);
  }

  post(url: string, data?: any) {
    const request = supertest(this.app).post(url);
    if (data) {
      request.send(data);
    }
    return request;
  }
}

/**
 * テスト用アサーションヘルパー
 */
export const assertions = {
  /**
   * API成功レスポンスの検証
   */
  expectSuccessResponse: (response: any, expectedData?: any) => {
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    
    if (expectedData) {
      expect(response.body.data).toMatchObject(expectedData);
    }
  },

  /**
   * API作成成功レスポンスの検証
   */
  expectCreatedResponse: (response: any, expectedData?: any) => {
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    
    if (expectedData) {
      expect(response.body.data).toMatchObject(expectedData);
    }
  },

  /**
   * APIエラーレスポンスの検証
   */
  expectErrorResponse: (response: any, expectedStatus: number, expectedMessage?: string) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    
    if (expectedMessage) {
      expect(response.body.error).toMatch(expectedMessage);
    }
  },

  /**
   * ページネーションレスポンスの検証
   */
  expectPaginatedResponse: (response: any, expectedTotal?: number) => {
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('page');
    expect(response.body.pagination).toHaveProperty('limit');
    expect(response.body.pagination).toHaveProperty('total');
    expect(response.body.pagination).toHaveProperty('totalPages');
    
    if (expectedTotal !== undefined) {
      expect(response.body.pagination.total).toBe(expectedTotal);
    }
  },

  /**
   * バリデーションエラーの検証
   */
  expectValidationError: (response: any, field?: string) => {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    
    if (field) {
      expect(response.body.error).toMatch(field);
    }
  },

  /**
   * 認証エラーの検証
   */
  expectAuthenticationError: (response: any) => {
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
  },

  /**
   * 認可エラーの検証
   */
  expectAuthorizationError: (response: any) => {
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
  },

  /**
   * Not Foundエラーの検証
   */
  expectNotFoundError: (response: any) => {
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
  }
};

/**
 * テストデータ生成ヘルパー
 */
export const generators = {
  /**
   * ランダムなユーザーデータ生成
   */
  randomUser: (overrides?: Partial<typeof testUsers[0]>) => ({
    ...testUsers[0],
    firebaseUid: `test-uid-${Math.random().toString(36).substr(2, 9)}`,
    email: `test-${Math.random().toString(36).substr(2, 5)}@example.com`,
    username: `testuser-${Math.random().toString(36).substr(2, 5)}`,
    ...overrides
  }),

  /**
   * ランダムな書籍データ生成
   */
  randomBook: (overrides?: Partial<typeof testBooks[0]>) => ({
    ...testBooks[0],
    isbn: `978${Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')}`,
    title: `テスト書籍 ${Math.random().toString(36).substr(2, 5)}`,
    ...overrides
  }),

  /**
   * ランダムな本棚データ生成
   */
  randomBookshelf: (userId: number, overrides?: Partial<typeof testBookshelves[0]>) => ({
    ...testBookshelves[0],
    userId,
    name: `テスト本棚 ${Math.random().toString(36).substr(2, 5)}`,
    ...overrides
  }),

  /**
   * テスト用ISBN生成
   */
  randomISBN: (type: 'isbn10' | 'isbn13' = 'isbn13') => {
    if (type === 'isbn10') {
      const base = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
      return base + '0'; // 簡略化されたチェックディジット
    } else {
      const base = `978${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
      return base + '0'; // 簡略化されたチェックディジット
    }
  }
};

/**
 * テスト実行時間測定ヘルパー
 */
export class TestTimer {
  private startTime: number;
  private measurements: Array<{ name: string; duration: number }> = [];

  constructor() {
    this.startTime = Date.now();
  }

  mark(name: string) {
    const now = Date.now();
    this.measurements.push({
      name,
      duration: now - this.startTime
    });
    this.startTime = now;
  }

  report() {
    console.log('⏱️ テスト実行時間:');
    this.measurements.forEach(({ name, duration }) => {
      console.log(`  ${name}: ${duration}ms`);
    });
  }

  getTotalDuration() {
    return this.measurements.reduce((total, { duration }) => total + duration, 0);
  }
}

/**
 * テスト環境のセットアップとクリーンアップ
 */
export const testEnvironment = {
  /**
   * テスト開始前のセットアップ
   */
  setup: async () => {
    // モックのリセット
    resetAllMocks();
    
    // 環境変数の設定確認
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DATABASE_URL).toBe(':memory:');
    
    console.log('🧪 テスト環境セットアップ完了');
  },

  /**
   * テスト終了後のクリーンアップ
   */
  cleanup: async () => {
    // モックのクリア
    jest.clearAllMocks();
    
    // タイマーのクリア
    jest.clearAllTimers();
    
    console.log('🧹 テスト環境クリーンアップ完了');
  }
};

/**
 * 非同期処理テストヘルパー
 */
export const asyncHelpers = {
  /**
   * 指定時間待機
   */
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * 条件が満たされるまで待機（ポーリング）
   */
  waitFor: async (
    condition: () => Promise<boolean> | boolean,
    timeout: number = 5000,
    interval: number = 100
  ) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await asyncHelpers.sleep(interval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },

  /**
   * Promise の settled 状態まで待機
   */
  waitForSettled: async (promises: Promise<any>[]) => {
    return Promise.allSettled(promises);
  }
};