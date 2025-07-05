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
const mockAuthInstance = {
  verifyIdToken: jest.fn(),
  getUser: jest.fn(),
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

export const mockFirebaseAdmin = {
  initializeApp: jest.fn(),
  auth: jest.fn(() => mockAuthInstance),
  credential: {
    cert: jest.fn(),
  },
};

// Firebase テストデータ
export const mockFirebaseUsers = [
  {
    uid: 'test-firebase-uid-1',
    email: 'user1@example.com',
    displayName: 'Test User 1',
    emailVerified: true,
    disabled: false,
  },
  {
    uid: 'test-firebase-uid-2', 
    email: 'user2@example.com',
    displayName: 'Test User 2',
    emailVerified: true,
    disabled: false,
  }
];

export const mockIdTokens = {
  'valid-token': {
    uid: 'test-firebase-uid-1',
    email: 'user1@example.com',
    email_verified: true,
    aud: 'test-project-id',
    iss: 'https://securetoken.google.com/test-project-id',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  },
  'expired-token': {
    uid: 'test-firebase-uid-2',
    email: 'user2@example.com',
    email_verified: true,
    aud: 'test-project-id',
    iss: 'https://securetoken.google.com/test-project-id',
    iat: Math.floor(Date.now() / 1000) - 7200,
    exp: Math.floor(Date.now() / 1000) - 3600
  }
};

/**
 * NDL API レスポンスモック
 */
export const mockNdlApiResponses = {
  success: (isbn: string) => ({
    status: 200,
    data: `<?xml version="1.0" encoding="UTF-8"?>
      <searchRetrieveResponse>
        <numberOfRecords>1</numberOfRecords>
        <records>
          <record>
            <recordData>
              <dcterms:title>リーダブルコード</dcterms:title>
              <dc:creator>Dustin Boswell</dc:creator>
              <dc:publisher>オライリージャパン</dc:publisher>
              <dcterms:issued>2012-06-23</dcterms:issued>
              <dc:identifier>${isbn}</dc:identifier>
            </recordData>
          </record>
        </records>
      </searchRetrieveResponse>`
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
    return Promise.reject(error);
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
  mockAuth.verifyIdToken.mockImplementation((token: string) => {
    if (token === 'invalid-token') {
      return Promise.reject(new Error('Firebase ID token has invalid signature'));
    } else if (token === 'expired-token') {
      return Promise.reject(new Error('Firebase ID token has expired'));
    } else if (mockIdTokens[token as keyof typeof mockIdTokens]) {
      return Promise.resolve(mockIdTokens[token as keyof typeof mockIdTokens]);
    } else {
      // デフォルトは有効なトークンとして扱う
      return Promise.resolve(mockIdTokens['valid-token']);
    }
  });
  
  // ユーザー情報取得のモック
  mockAuth.getUser.mockImplementation((uid: string) => {
    const user = mockFirebaseUsers.find(u => u.uid === uid);
    if (user) {
      return Promise.resolve(user);
    } else {
      return Promise.reject(new Error(`There is no user record corresponding to the provided identifier: ${uid}`));
    }
  });
  
  // ユーザー情報をメールで取得するモック
  mockAuth.getUserByEmail.mockImplementation((email: string) => {
    const user = mockFirebaseUsers.find(u => u.email === email);
    if (user) {
      return Promise.resolve(user);
    } else {
      return Promise.reject(new Error(`There is no user record corresponding to the provided email: ${email}`));
    }
  });
  
  // ユーザー作成のモック
  mockAuth.createUser.mockImplementation((userRecord: any) => {
    const newUser = {
      uid: `mock-uid-${Date.now()}`,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: false,
      disabled: false,
    };
    mockFirebaseUsers.push(newUser);
    return Promise.resolve(newUser);
  });
  
  // ユーザー更新のモック
  mockAuth.updateUser.mockImplementation((uid: string, userRecord: any) => {
    const userIndex = mockFirebaseUsers.findIndex(u => u.uid === uid);
    if (userIndex !== -1) {
      mockFirebaseUsers[userIndex] = { ...mockFirebaseUsers[userIndex], ...userRecord };
      return Promise.resolve(mockFirebaseUsers[userIndex]);
    } else {
      return Promise.reject(new Error(`There is no user record corresponding to the provided identifier: ${uid}`));
    }
  });
  
  // ユーザー削除のモック
  mockAuth.deleteUser.mockImplementation((uid: string) => {
    const userIndex = mockFirebaseUsers.findIndex(u => u.uid === uid);
    if (userIndex !== -1) {
      mockFirebaseUsers.splice(userIndex, 1);
      return Promise.resolve(undefined);
    } else {
      return Promise.reject(new Error(`There is no user record corresponding to the provided identifier: ${uid}`));
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
      return mockNdlApiResponses.timeout();
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