/**
 * データベーステストヘルパー
 * テスト用データベース操作のユーティリティ関数
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { expect } from '@jest/globals';
import { testUsers, testBooks, testUserBooks, testBookshelves } from '../fixtures/testData.js';
import type { Database as DrizzleDatabase } from '../../repositories/BaseRepository.js';
import * as schema from '../../models/index.js';

/**
 * テスト用データベースクラス
 */
export class TestDatabase {
  public sqliteDb: Database.Database;
  public db: DrizzleDatabase;
  
  constructor() {
    // インメモリSQLiteデータベースを作成
    this.sqliteDb = new Database(':memory:');
    this.db = drizzle(this.sqliteDb, { schema });
    this.initializeSchema();
  }

  /**
   * データベーススキーマの初期化
   */
  private initializeSchema() {
    const schema = `
      -- ユーザーテーブル
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 書籍テーブル
      CREATE TABLE books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        isbn TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        publisher TEXT,
        published_date TEXT,
        description TEXT,
        page_count INTEGER,
        thumbnail TEXT,
        price REAL,
        series TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- ユーザー書籍テーブル
      CREATE TABLE user_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
        UNIQUE(user_id, book_id)
      );

      -- 本棚テーブル
      CREATE TABLE bookshelves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      -- 本棚書籍テーブル
      CREATE TABLE bookshelf_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bookshelf_id INTEGER NOT NULL,
        user_book_id INTEGER NOT NULL,
        display_order INTEGER DEFAULT 0,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bookshelf_id) REFERENCES bookshelves (id) ON DELETE CASCADE,
        FOREIGN KEY (user_book_id) REFERENCES user_books (id) ON DELETE CASCADE,
        UNIQUE(bookshelf_id, user_book_id)
      );

      -- フォローテーブル
      CREATE TABLE follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER NOT NULL,
        following_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(follower_id, following_id)
      );

      -- ブロックテーブル
      CREATE TABLE blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blocker_id INTEGER NOT NULL,
        blocked_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blocker_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (blocked_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(blocker_id, blocked_id)
      );

      -- インデックス作成
      CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_books_isbn ON books(isbn);
      CREATE INDEX idx_user_books_user_id ON user_books(user_id);
      CREATE INDEX idx_user_books_book_id ON user_books(book_id);
      CREATE INDEX idx_bookshelves_user_id ON bookshelves(user_id);
      CREATE INDEX idx_bookshelf_books_bookshelf_id ON bookshelf_books(bookshelf_id);
    `;

    this.sqliteDb.exec(schema);
    console.log('📊 テスト用データベーススキーマ初期化完了');
  }

  /**
   * 全テーブルのデータをクリア
   */
  clearAll() {
    const tables = [
      'bookshelf_books',
      'bookshelves',
      'user_books',
      'books',
      'follows',
      'blocks',
      'users'
    ];

    for (const table of tables) {
      this.sqliteDb.prepare(`DELETE FROM ${table}`).run();
    }

    // Auto incrementをリセット
    for (const table of tables) {
      this.sqliteDb.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
    }

    console.log('🗑️ 全テーブルデータクリア完了');
  }

  /**
   * テストユーザーの挿入
   */
  insertTestUsers() {
    const stmt = this.sqliteDb.prepare(`
      INSERT INTO users (firebase_uid, email, username)
      VALUES (?, ?, ?)
    `);

    const insertedUsers = [];
    for (const user of testUsers) {
      const result = stmt.run(user.firebaseUid, user.email, user.username);
      insertedUsers.push({
        id: result.lastInsertRowid as number,
        ...user
      });
    }

    console.log(`👥 テストユーザー ${insertedUsers.length}件 挿入完了`);
    return insertedUsers;
  }

  /**
   * テスト書籍の挿入
   */
  insertTestBooks() {
    const stmt = this.sqliteDb.prepare(`
      INSERT INTO books (isbn, title, author, publisher, published_date, description, page_count, thumbnail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertedBooks = [];
    for (const book of testBooks) {
      const result = stmt.run(
        book.isbn,
        book.title,
        book.author,
        book.publisher,
        book.publishedDate,
        book.description,
        book.pageCount,
        book.thumbnail
      );
      insertedBooks.push({
        id: result.lastInsertRowid as number,
        ...book
      });
    }

    console.log(`📚 テスト書籍 ${insertedBooks.length}件 挿入完了`);
    return insertedBooks;
  }

  /**
   * テストユーザー書籍の挿入
   */
  insertTestUserBooks() {
    const stmt = this.sqliteDb.prepare(`
      INSERT INTO user_books (user_id, book_id, is_read)
      VALUES (?, ?, ?)
    `);

    const insertedUserBooks = [];
    for (const userBook of testUserBooks) {
      const result = stmt.run(userBook.userId, userBook.bookId, userBook.isRead);
      insertedUserBooks.push({
        id: result.lastInsertRowid as number,
        ...userBook
      });
    }

    console.log(`📖 テストユーザー書籍 ${insertedUserBooks.length}件 挿入完了`);
    return insertedUserBooks;
  }

  /**
   * テスト本棚の挿入
   */
  insertTestBookshelves() {
    const stmt = this.sqliteDb.prepare(`
      INSERT INTO bookshelves (user_id, name, description, is_public)
      VALUES (?, ?, ?, ?)
    `);

    const insertedBookshelves = [];
    for (const bookshelf of testBookshelves) {
      const result = stmt.run(
        bookshelf.userId,
        bookshelf.name,
        bookshelf.description,
        bookshelf.isPublic
      );
      insertedBookshelves.push({
        id: result.lastInsertRowid as number,
        ...bookshelf
      });
    }

    console.log(`🗂️ テスト本棚 ${insertedBookshelves.length}件 挿入完了`);
    return insertedBookshelves;
  }

  /**
   * 全テストデータの挿入
   */
  insertAllTestData() {
    const users = this.insertTestUsers();
    const books = this.insertTestBooks();
    const userBooks = this.insertTestUserBooks();
    const bookshelves = this.insertTestBookshelves();

    return {
      users,
      books,
      userBooks,
      bookshelves
    };
  }

  /**
   * テーブルの行数確認
   */
  getTableCounts() {
    const tables = ['users', 'books', 'user_books', 'bookshelves', 'bookshelf_books'];
    const counts: Record<string, number> = {};

    for (const table of tables) {
      const result = this.sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
      counts[table] = result.count;
    }

    return counts;
  }

  /**
   * 特定ユーザーのデータ取得
   */
  getUserData(userId: number) {
    const user = this.sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const books = this.sqliteDb.prepare(`
      SELECT ub.*, b.* FROM user_books ub
      JOIN books b ON ub.book_id = b.id
      WHERE ub.user_id = ?
    `).all(userId);
    const bookshelves = this.sqliteDb.prepare('SELECT * FROM bookshelves WHERE user_id = ?').all(userId);

    return { user, books, bookshelves };
  }

  /**
   * トランザクション実行
   */
  transaction<T>(callback: (db: Database.Database) => T): T {
    const transaction = this.sqliteDb.transaction(callback);
    return transaction(this.sqliteDb);
  }

  /**
   * データベースのクローズ
   */
  close() {
    this.sqliteDb.close();
    console.log('🔒 テスト用データベースクローズ完了');
  }
}

/**
 * テスト用データベースの生成とクリーンアップ
 */
export const dbTestUtils = {
  /**
   * 新しいテストデータベースインスタンス作成
   */
  create: () => new TestDatabase(),

  /**
   * データベースのセットアップ（各テスト前）
   */
  setup: (testDb: TestDatabase) => {
    testDb.clearAll();
    return testDb.insertAllTestData();
  },

  /**
   * データベースのクリーンアップ（各テスト後）
   */
  cleanup: (testDb: TestDatabase) => {
    testDb.clearAll();
  },

  /**
   * データベースの破棄（テストスイート終了後）
   */
  destroy: (testDb: TestDatabase) => {
    testDb.close();
  }
};

/**
 * 従来の関数ベースAPI（後方互換性）
 */
export const createTestDatabase = () => {
  const testDb = new TestDatabase();
  return testDb.db; // DrizzleのDatabaseインスタンスを返す
};

export const closeTestDatabase = (db: DrizzleDatabase) => {
  // Drizzle の場合、直接的なclose方法はないため、何もしない
  // 実際のcloseは TestDatabase.close() を通じて行う
  console.log('🔒 テスト用データベースクローズ完了');
};

/**
 * データベーステストアサーション
 */
export const dbAssertions = {
  /**
   * テーブルの行数確認
   */
  expectTableCount: (testDb: TestDatabase, table: string, expectedCount: number) => {
    const result = testDb.sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
    expect(result.count).toBe(expectedCount);
  },

  /**
   * レコードの存在確認
   */
  expectRecordExists: (testDb: TestDatabase, table: string, condition: Record<string, any>) => {
    const conditions = Object.keys(condition).map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(condition);
    const result = testDb.sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${conditions}`).get(...values) as { count: number };
    expect(result.count).toBeGreaterThan(0);
  },

  /**
   * レコードの非存在確認
   */
  expectRecordNotExists: (testDb: TestDatabase, table: string, condition: Record<string, any>) => {
    const conditions = Object.keys(condition).map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(condition);
    const result = testDb.sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${conditions}`).get(...values) as { count: number };
    expect(result.count).toBe(0);
  },

  /**
   * ユーザー関連データの整合性確認
   */
  expectUserDataIntegrity: (testDb: TestDatabase, userId: number) => {
    const userData = testDb.getUserData(userId);
    
    // ユーザーが存在すること
    expect(userData.user).toBeTruthy();
    
    // 外部キー制約の確認
    for (const book of userData.books) {
      expect(book.userId).toBe(userId);
    }
    
    for (const bookshelf of userData.bookshelves) {
      expect(bookshelf.userId).toBe(userId);
    }
  }
};