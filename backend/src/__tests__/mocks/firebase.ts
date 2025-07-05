/**
 * Firebase Admin SDK モック
 * テスト用のFirebase認証機能をモック化
 */

import { jest } from '@jest/globals';

// Firebase Auth モック用のテストユーザーデータ
export const mockUsers = [
  {
    uid: 'test-firebase-uid-1',
    email: 'user1@example.com',
    displayName: 'Test User 1',
    emailVerified: true,
    disabled: false,
    metadata: {
      creationTime: '2023-01-01T00:00:00.000Z',
      lastSignInTime: '2023-12-01T00:00:00.000Z'
    }
  },
  {
    uid: 'test-firebase-uid-2',
    email: 'user2@example.com',
    displayName: 'Test User 2',
    emailVerified: true,
    disabled: false,
    metadata: {
      creationTime: '2023-01-01T00:00:00.000Z',
      lastSignInTime: '2023-12-01T00:00:00.000Z'
    }
  }
];

// Firebase ID Token モック
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

// Firebase Auth モック実装
export const mockAuth = {
  verifyIdToken: jest.fn((token: string) => {
    return new Promise((resolve, reject) => {
      if (token === 'invalid-token') {
        reject(new Error('Firebase ID token has invalid signature'));
      } else if (token === 'expired-token') {
        reject(new Error('Firebase ID token has expired'));
      } else if (mockIdTokens[token as keyof typeof mockIdTokens]) {
        resolve(mockIdTokens[token as keyof typeof mockIdTokens]);
      } else {
        // デフォルトは有効なトークンとして扱う
        resolve(mockIdTokens['valid-token']);
      }
    });
  }),

  getUser: jest.fn((uid: string) => {
    return new Promise((resolve, reject) => {
      const user = mockUsers.find(u => u.uid === uid);
      if (user) {
        resolve(user);
      } else {
        reject(new Error(`There is no user record corresponding to the provided identifier: ${uid}`));
      }
    });
  }),

  getUserByEmail: jest.fn((email: string) => {
    return new Promise((resolve, reject) => {
      const user = mockUsers.find(u => u.email === email);
      if (user) {
        resolve(user);
      } else {
        reject(new Error(`There is no user record corresponding to the provided email: ${email}`));
      }
    });
  }),

  createUser: jest.fn((userRecord: any) => {
    return new Promise((resolve) => {
      const newUser = {
        uid: `mock-uid-${Date.now()}`,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: false,
        disabled: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: null
        }
      };
      mockUsers.push(newUser);
      resolve(newUser);
    });
  }),

  updateUser: jest.fn((uid: string, userRecord: any) => {
    return new Promise((resolve, reject) => {
      const userIndex = mockUsers.findIndex(u => u.uid === uid);
      if (userIndex !== -1) {
        mockUsers[userIndex] = { ...mockUsers[userIndex], ...userRecord };
        resolve(mockUsers[userIndex]);
      } else {
        reject(new Error(`There is no user record corresponding to the provided identifier: ${uid}`));
      }
    });
  }),

  deleteUser: jest.fn((uid: string) => {
    return new Promise((resolve, reject) => {
      const userIndex = mockUsers.findIndex(u => u.uid === uid);
      if (userIndex !== -1) {
        mockUsers.splice(userIndex, 1);
        resolve(undefined);
      } else {
        reject(new Error(`There is no user record corresponding to the provided identifier: ${uid}`));
      }
    });
  })
};

// Firebase Admin SDK全体のモック
export const mockFirebaseAdmin = {
  initializeApp: jest.fn(() => ({
    name: 'test-app',
    options: {}
  })),
  
  auth: jest.fn(() => mockAuth),
  
  credential: {
    cert: jest.fn(() => ({})),
    applicationDefault: jest.fn(() => ({}))
  },
  
  apps: []
};

// Jest モック設定のヘルパー関数
export const setupFirebaseMocks = () => {
  // Firebase Admin SDKのモック設定
  jest.doMock('firebase-admin', () => mockFirebaseAdmin);
  
  // 環境変数の設定
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
    type: 'service_account',
    project_id: 'test-project-id',
    private_key_id: 'test-key-id',
    private_key: '-----BEGIN PRIVATE KEY-----\ntest-private-key\n-----END PRIVATE KEY-----\n',
    client_email: 'test@test-project-id.iam.gserviceaccount.com',
    client_id: 'test-client-id',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token'
  });
  
  // モック実装を再設定
  resetFirebaseMocks();
};

// モックリセット関数
export const resetFirebaseMocks = () => {
  // 個別のFirebaseモック関数のみをリセット
  mockAuth.verifyIdToken.mockClear();
  mockAuth.getUser.mockClear();
  mockAuth.getUserByEmail.mockClear();
  mockAuth.createUser.mockClear();
  mockAuth.updateUser.mockClear();
  mockAuth.deleteUser.mockClear();
  
  // モック実装をリセット
  mockAuth.verifyIdToken.mockImplementation((token: string) => {
    return new Promise((resolve, reject) => {
      if (token === 'invalid-token') {
        reject(new Error('Firebase ID token has invalid signature'));
      } else if (token === 'expired-token') {
        reject(new Error('Firebase ID token has expired'));
      } else if (mockIdTokens[token as keyof typeof mockIdTokens]) {
        resolve(mockIdTokens[token as keyof typeof mockIdTokens]);
      } else {
        resolve(mockIdTokens['valid-token']);
      }
    });
  });
  
  mockAuth.getUser.mockImplementation((uid: string) => {
    return new Promise((resolve, reject) => {
      const user = mockUsers.find(u => u.uid === uid);
      if (user) {
        resolve(user);
      } else {
        reject(new Error(`There is no user record corresponding to the provided identifier: ${uid}`));
      }
    });
  });
};

// デフォルトでモックを設定
setupFirebaseMocks();