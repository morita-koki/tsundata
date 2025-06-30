/**
 * 外部API モック定義
 * テスト中の外部API呼び出しをモック化
 */

import { jest } from '@jest/globals';
import { testResponses } from '../fixtures/testData.js';

/**
 * Axios モックの設定
 */
export const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => mockAxios),
  defaults: {
    timeout: 5000
  }
};

/**
 * Firebase Admin SDK モック
 */
export const mockFirebaseAdmin = {
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
  })),
  credential: {
    cert: jest.fn(),
  },
};

/**
 * NDL API レスポンスモック
 */
export const mockNdlApiResponses = {
  success: (isbn: string) => ({
    status: 200,
    data: testResponses.ndlApi.success.replace('9784797382570', isbn)
  }),
  
  notFound: () => ({
    status: 200,
    data: testResponses.ndlApi.notFound
  }),
  
  serverError: () => ({
    status: 500,
    statusText: 'Internal Server Error'
  }),
  
  timeout: () => {
    const error = new Error('timeout of 5000ms exceeded');
    (error as any).code = 'ECONNABORTED';
    throw error;
  },
  
  rateLimited: () => ({
    status: 429,
    statusText: 'Too Many Requests',
    headers: {
      'retry-after': '60'
    }
  })
};

/**
 * Google Books API レスポンスモック
 */
export const mockGoogleBooksApiResponses = {
  success: (isbn: string) => ({
    status: 200,
    data: {
      ...testResponses.googleBooksApi.success,
      items: testResponses.googleBooksApi.success.items.map(item => ({
        ...item,
        volumeInfo: {
          ...item.volumeInfo,
          industryIdentifiers: [
            { type: 'ISBN_13', identifier: isbn }
          ]
        }
      }))
    }
  }),
  
  notFound: () => ({
    status: 200,
    data: testResponses.googleBooksApi.notFound
  }),
  
  quotaExceeded: () => ({
    status: 403,
    data: {
      error: {
        code: 403,
        message: 'The request cannot be completed because you have exceeded your quota.',
        errors: [
          {
            message: 'The request cannot be completed because you have exceeded your quota.',
            domain: 'usageLimits',
            reason: 'quotaExceeded'
          }
        ]
      }
    }
  }),
  
  invalidKey: () => ({
    status: 400,
    data: {
      error: {
        code: 400,
        message: 'API key not valid.',
        errors: [
          {
            message: 'API key not valid.',
            domain: 'global',
            reason: 'badRequest'
          }
        ]
      }
    }
  })
};

/**
 * Axios モックのセットアップ
 */
export function setupAxiosMocks() {
  // デフォルトの成功レスポンス
  mockAxios.get.mockImplementation((url: string) => {
    if (url.includes('iss.ndl.go.jp')) {
      return Promise.resolve(mockNdlApiResponses.success('9784797382570'));
    } else if (url.includes('googleapis.com/books')) {
      return Promise.resolve(mockGoogleBooksApiResponses.success('9784797382570'));
    }
    // 予期しないURLの場合は、デフォルトの空レスポンスを返す
    console.warn(`⚠️ Unmocked URL accessed in test: ${url}`);
    return Promise.resolve({ status: 200, data: {} });
  });

  mockAxios.post.mockResolvedValue({ status: 200, data: {} });
  mockAxios.put.mockResolvedValue({ status: 200, data: {} });
  mockAxios.delete.mockResolvedValue({ status: 204, data: {} });
}

/**
 * Firebase Admin SDK モックのセットアップ
 */
export function setupFirebaseMocks() {
  const mockAuth = mockFirebaseAdmin.auth();
  
  // ID トークン検証のモック
  (mockAuth.verifyIdToken as jest.MockedFunction<any>).mockImplementation((token: string) => {
    if (token === 'valid-token') {
      return Promise.resolve({
        uid: 'test-firebase-uid-1',
        email: 'user1@example.com'
      });
    } else if (token === 'expired-token') {
      return Promise.reject(new Error('Firebase ID token has expired'));
    } else {
      return Promise.reject(new Error('Firebase ID token is invalid'));
    }
  });
  
  // ユーザー情報取得のモック
  (mockAuth.getUser as jest.MockedFunction<any>).mockImplementation((uid: string) => {
    if (uid === 'test-firebase-uid-1') {
      return Promise.resolve({
        uid: 'test-firebase-uid-1',
        email: 'user1@example.com',
        displayName: 'Test User 1'
      });
    } else {
      return Promise.reject(new Error('User not found'));
    }
  });
}

/**
 * 特定のシナリオ用のモック設定
 */
export const mockScenarios = {
  // NDL API エラーシナリオ
  ndlApiError: () => {
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('iss.ndl.go.jp')) {
        return Promise.reject(mockNdlApiResponses.serverError());
      }
      return mockAxios.get(url);
    });
  },
  
  // Google Books API エラーシナリオ
  googleBooksApiError: () => {
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('googleapis.com/books')) {
        return Promise.reject(mockGoogleBooksApiResponses.quotaExceeded());
      }
      return mockAxios.get(url);
    });
  },
  
  // 両API エラーシナリオ
  allApisError: () => {
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('iss.ndl.go.jp')) {
        return Promise.reject(mockNdlApiResponses.serverError());
      } else if (url.includes('googleapis.com/books')) {
        return Promise.reject(mockGoogleBooksApiResponses.quotaExceeded());
      }
      return Promise.reject(new Error(`Unmocked URL: ${url}`));
    });
  },
  
  // ネットワークタイムアウトシナリオ
  networkTimeout: () => {
    mockAxios.get.mockImplementation(() => {
      return Promise.reject(mockNdlApiResponses.timeout());
    });
  }
};

/**
 * モックのリセット
 */
export function resetAllMocks() {
  jest.clearAllMocks();
  setupAxiosMocks();
  setupFirebaseMocks();
}

// Jest モジュールモック設定
jest.mock('axios', () => ({
  default: mockAxios,
  ...mockAxios
}));

jest.mock('firebase-admin', () => mockFirebaseAdmin);