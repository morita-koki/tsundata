/**
 * Jest セットアップファイル
 * 各テストファイル実行前に実行される共通設定
 */

import { beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { resetAllMocks } from './mocks/externalApi.js';

// テスト用のタイムアウト延長
jest.setTimeout(30000);

// 外部API呼び出しのモック設定
beforeAll(() => {
  console.log('🧪 テストセットアップ開始');

  // axios のモック設定（外部API呼び出しを防ぐ）
  jest.mock('axios', () => ({
    default: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      }))
    }
  }));

  // 外部APIモックの設定
  resetAllMocks();

  // console.log, console.error のモック（テスト出力を整理）
  if (process.env.SILENT_TESTS === 'true') {
    console.log = jest.fn();
    console.error = jest.fn();
  }
});

// 各テスト前のクリーンアップ
beforeEach(() => {
  // 全モックのリセット
  resetAllMocks();
  
  // タイマーのクリア
  jest.clearAllTimers();
});

// 各テスト後のクリーンアップ
afterEach(() => {
  // メモリリークを防ぐためのクリーンアップ
  jest.restoreAllMocks();
});

// テストセットアップ完了後のクリーンアップ
afterAll(() => {
  console.log('🧪 テストセットアップ完了');
});

// グローバルなテストヘルパー関数
declare global {
  namespace globalThis {
    var testHelper: {
      // データベーステストユーティリティ
      createTestDatabase: () => Promise<any>;
      cleanupTestDatabase: (db: any) => Promise<void>;
      
      // 認証テストユーティリティ
      createTestUser: () => any;
      createTestJWT: (userId: number) => string;
      
      // APIテストユーティリティ
      makeAuthenticatedRequest: (app: any, method: string, url: string, data?: any) => any;
    };
  }
}

// テストヘルパー関数の実装は別ファイルで定義
// これはglobalSetup.tsで設定される