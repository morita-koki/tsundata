/**
 * Jest グローバルセットアップ
 * 全テスト実行前に一度だけ実行される初期化処理
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * グローバルセットアップ関数
 */
export default async function globalSetup() {
  console.log('🚀 テストスイート グローバルセットアップ開始');

  // テスト用の一時ディレクトリ作成
  const testTempDir = path.join(process.cwd(), 'tmp', 'test');
  try {
    await fs.mkdir(testTempDir, { recursive: true });
    console.log(`📁 テスト用一時ディレクトリ作成: ${testTempDir}`);
  } catch (error) {
    console.warn('⚠️ テスト用ディレクトリ作成に失敗:', error);
  }

  // テスト用カバレッジディレクトリの準備
  const coverageDir = path.join(process.cwd(), 'coverage');
  try {
    await fs.mkdir(coverageDir, { recursive: true });
  } catch (error) {
    // カバレッジディレクトリ作成失敗は無視
  }

  // グローバルテストヘルパーの実装
  setupGlobalTestHelpers();

  console.log('✅ グローバルセットアップ完了');
}

/**
 * グローバルテストヘルパー関数の設定
 */
function setupGlobalTestHelpers() {
  // TypeScriptでのdynamic importのためのヘルパー
  global.testHelper = {
    // テスト用データベース作成
    createTestDatabase: async () => {
      // インメモリSQLiteデータベースを作成
      const { default: Database } = await import('better-sqlite3');
      const db = new Database(':memory:');
      
      // テーブル作成SQL（本番のschemaを簡略化）
      const schema = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firebaseUid TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          isbn TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          publisher TEXT,
          publishedDate TEXT,
          description TEXT,
          pageCount INTEGER,
          thumbnail TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE user_books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          bookId INTEGER NOT NULL,
          isRead BOOLEAN DEFAULT FALSE,
          addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          readAt DATETIME,
          FOREIGN KEY (userId) REFERENCES users (id),
          FOREIGN KEY (bookId) REFERENCES books (id),
          UNIQUE(userId, bookId)
        );

        CREATE TABLE bookshelves (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          isPublic BOOLEAN DEFAULT FALSE,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users (id)
        );

        CREATE TABLE bookshelf_books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bookshelfId INTEGER NOT NULL,
          userBookId INTEGER NOT NULL,
          displayOrder INTEGER DEFAULT 0,
          addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (bookshelfId) REFERENCES bookshelves (id),
          FOREIGN KEY (userBookId) REFERENCES user_books (id),
          UNIQUE(bookshelfId, userBookId)
        );
      `;

      // スキーマ実行
      db.exec(schema);
      
      console.log('📊 テスト用データベーススキーマ作成完了');
      return db;
    },

    // テスト用データベースクリーンアップ
    cleanupTestDatabase: async (db: any) => {
      if (db && typeof db.close === 'function') {
        db.close();
        console.log('🗑️ テスト用データベースクローズ完了');
      }
    },

    // テスト用ユーザー作成
    createTestUser: () => ({
      id: 1,
      firebaseUid: 'test-firebase-uid',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: new Date(),
      updatedAt: new Date()
    }),

    // テスト用JWT作成
    createTestJWT: (userId: number) => {
      // 実際のJWT生成は簡略化（テスト用）
      return `test-jwt-token-for-user-${userId}`;
    },

    // 認証付きAPIリクエストヘルパー
    makeAuthenticatedRequest: async (app: any, method: string, url: string, data?: any) => {
      const { default: supertest } = await import('supertest');
      const request = supertest(app);
      
      const req = request[method.toLowerCase()](url);
      
      // Authorization ヘッダー追加
      req.set('Authorization', 'Bearer test-jwt-token');
      
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        req.send(data);
      }
      
      return req;
    }
  };

  console.log('🛠️ グローバルテストヘルパー設定完了');
}