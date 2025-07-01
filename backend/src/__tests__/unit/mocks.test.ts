/**
 * モック機能テスト
 * 外部API モックの動作確認
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  mockAxios, 
  mockFirebaseAdmin, 
  mockNdlApiResponses, 
  mockGoogleBooksApiResponses,
  setupAxiosMocks,
  setupFirebaseMocks,
  resetAllMocks,
  mockScenarios
} from '../mocks/externalApi.js';

describe('🎭 モック機能テスト', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Axios モック', () => {
    it('GET リクエストがモック化される', async () => {
      mockAxios.get.mockResolvedValue({ 
        status: 200, 
        data: { message: 'mocked response' } 
      });

      const response = await mockAxios.get('https://example.com/api');
      
      expect(mockAxios.get).toHaveBeenCalledWith('https://example.com/api');
      expect(response.status).toBe(200);
      expect(response.data.message).toBe('mocked response');
    });

    it('POST リクエストがモック化される', async () => {
      mockAxios.post.mockResolvedValue({ 
        status: 201, 
        data: { id: 1 } 
      });

      const response = await mockAxios.post('https://example.com/api', { name: 'test' });
      
      expect(mockAxios.post).toHaveBeenCalledWith('https://example.com/api', { name: 'test' });
      expect(response.status).toBe(201);
      expect(response.data.id).toBe(1);
    });

    it('エラーレスポンスがモック化される', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(mockAxios.get('https://example.com/api')).rejects.toThrow('Network Error');
      expect(mockAxios.get).toHaveBeenCalledWith('https://example.com/api');
    });
  });

  describe('Firebase Admin SDK モック', () => {
    it('Firebase 初期化がモック化される', () => {
      mockFirebaseAdmin.initializeApp();
      expect(mockFirebaseAdmin.initializeApp).toHaveBeenCalled();
    });

    it('ID トークン検証がモック化される', async () => {
      setupFirebaseMocks();
      const auth = mockFirebaseAdmin.auth();

      // 有効なトークンのテスト
      const validResult = await auth.verifyIdToken('valid-token');
      expect(validResult.uid).toBe('test-firebase-uid-1');
      expect(validResult.email).toBe('user1@example.com');

      // 無効なトークンのテスト
      await expect(auth.verifyIdToken('invalid-token')).rejects.toThrow('Firebase ID token is invalid');
      
      // 期限切れトークンのテスト
      await expect(auth.verifyIdToken('expired-token')).rejects.toThrow('Firebase ID token has expired');
    });

    it('ユーザー情報取得がモック化される', async () => {
      setupFirebaseMocks();
      const auth = mockFirebaseAdmin.auth();

      // 存在するユーザーのテスト
      const user = await auth.getUser('test-firebase-uid-1');
      expect(user.uid).toBe('test-firebase-uid-1');
      expect(user.email).toBe('user1@example.com');

      // 存在しないユーザーのテスト
      await expect(auth.getUser('non-existent-uid')).rejects.toThrow('User not found');
    });
  });

  describe('NDL API レスポンスモック', () => {
    it('成功レスポンスが正しく生成される', () => {
      const response = mockNdlApiResponses.success('9784797382570');
      
      expect(response.status).toBe(200);
      expect(response.data).toContain('9784797382570');
      expect(response.data).toContain('<dcterms:title>リーダブルコード</dcterms:title>');
    });

    it('見つからないレスポンスが正しく生成される', () => {
      const response = mockNdlApiResponses.notFound();
      
      expect(response.status).toBe(200);
      expect(response.data).toContain('<numberOfRecords>0</numberOfRecords>');
    });

    it('サーバーエラーレスポンスが正しく生成される', () => {
      const response = mockNdlApiResponses.serverError();
      
      expect(response.status).toBe(500);
      expect(response.statusText).toBe('Internal Server Error');
    });

    it('レート制限レスポンスが正しく生成される', () => {
      const response = mockNdlApiResponses.rateLimited();
      
      expect(response.status).toBe(429);
      expect(response.statusText).toBe('Too Many Requests');
      expect(response.headers['retry-after']).toBe('60');
    });

    it('タイムアウトエラーが正しく発生する', () => {
      expect(() => mockNdlApiResponses.timeout()).toThrow('timeout of 5000ms exceeded');
    });
  });

  describe('Google Books API レスポンスモック', () => {
    it('成功レスポンスが正しく生成される', () => {
      const response = mockGoogleBooksApiResponses.success('9784048930598');
      
      expect(response.status).toBe(200);
      expect(response.data.items).toHaveLength(1);
      expect(response.data.items[0].volumeInfo.industryIdentifiers[0].identifier).toBe('9784048930598');
    });

    it('見つからないレスポンスが正しく生成される', () => {
      const response = mockGoogleBooksApiResponses.notFound();
      
      expect(response.status).toBe(200);
      expect(response.data.totalItems).toBe(0);
      expect(response.data.items).toHaveLength(0);
    });

    it('クォータ超過エラーが正しく生成される', () => {
      const response = mockGoogleBooksApiResponses.quotaExceeded();
      
      expect(response.status).toBe(403);
      expect(response.data.error.message).toContain('exceeded your quota');
    });

    it('無効なAPIキーエラーが正しく生成される', () => {
      const response = mockGoogleBooksApiResponses.invalidKey();
      
      expect(response.status).toBe(400);
      expect(response.data.error.message).toContain('API key not valid');
    });
  });

  describe('モックシナリオ', () => {
    it('NDL API エラーシナリオが動作する', async () => {
      mockScenarios.ndlApiError();
      
      await expect(mockAxios.get('https://iss.ndl.go.jp/api/opensearch')).rejects.toBeTruthy();
      expect(mockAxios.get).toHaveBeenCalled();
    });

    it('Google Books API エラーシナリオが動作する', async () => {
      mockScenarios.googleBooksApiError();
      
      await expect(mockAxios.get('https://www.googleapis.com/books/v1/volumes')).rejects.toBeTruthy();
      expect(mockAxios.get).toHaveBeenCalled();
    });

    it('全API エラーシナリオが動作する', async () => {
      mockScenarios.allApisError();
      
      await expect(mockAxios.get('https://iss.ndl.go.jp/api/opensearch')).rejects.toBeTruthy();
      await expect(mockAxios.get('https://www.googleapis.com/books/v1/volumes')).rejects.toBeTruthy();
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });

    it('ネットワークタイムアウトシナリオが動作する', async () => {
      mockScenarios.networkTimeout();
      
      await expect(mockAxios.get('https://iss.ndl.go.jp/api/opensearch')).rejects.toThrow('timeout of 5000ms exceeded');
      expect(mockAxios.get).toHaveBeenCalled();
    });
  });

  describe('モックのリセット機能', () => {
    it('モックがリセットされる', () => {
      // モック呼び出し
      mockAxios.get('https://example.com');
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
      
      // リセット実行
      resetAllMocks();
      
      // モック設定が再セットアップされることを確認
      expect(mockAxios.get).toBeDefined();
      expect(mockFirebaseAdmin.auth).toBeDefined();
    });

    it('mockAxios.get のモック実装が正しく設定される', async () => {
      setupAxiosMocks();
      
      // NDL API URL のテスト
      const ndlResponse = await mockAxios.get('https://iss.ndl.go.jp/api/opensearch?query=test');
      expect(ndlResponse.status).toBe(200);
      expect(ndlResponse.data).toContain('リーダブルコード');
      
      // Google Books API URL のテスト
      const googleResponse = await mockAxios.get('https://www.googleapis.com/books/v1/volumes?q=isbn:test');
      expect(googleResponse.status).toBe(200);
      expect(googleResponse.data.items).toBeDefined();
    });

    it('Firebase モックが正しく設定される', async () => {
      setupFirebaseMocks();
      
      const auth = mockFirebaseAdmin.auth();
      const result = await auth.verifyIdToken('valid-token');
      
      expect(result.uid).toBe('test-firebase-uid-1');
      expect(result.email).toBe('user1@example.com');
    });
  });
});