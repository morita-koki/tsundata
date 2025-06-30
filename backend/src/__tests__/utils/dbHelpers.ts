/**
 * データベーステストヘルパー
 * テスト用データベース操作のユーティリティ関数
 */

import Database from 'better-sqlite3';
import { testUsers, testBooks, testUserBooks, testBookshelves } from '../fixtures/testData.js';

/**
 * テスト用データベースクラス
 */
export class TestDatabase {
  public db: Database.Database;
  
  constructor() {
    // インメモリSQLiteデータベースを作成
    this.db = new Database(':memory:');
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
        firebaseUid TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 書籍テーブル
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

      -- ユーザー書籍テーブル
      CREATE TABLE user_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        bookId INTEGER NOT NULL,
        isRead BOOLEAN DEFAULT FALSE,
        addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        readAt DATETIME,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (bookId) REFERENCES books (id) ON DELETE CASCADE,
        UNIQUE(userId, bookId)
      );

      -- 本棚テーブル
      CREATE TABLE bookshelves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        isPublic BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      );

      -- 本棚書籍テーブル
      CREATE TABLE bookshelf_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bookshelfId INTEGER NOT NULL,
        userBookId INTEGER NOT NULL,
        displayOrder INTEGER DEFAULT 0,
        addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bookshelfId) REFERENCES bookshelves (id) ON DELETE CASCADE,
        FOREIGN KEY (userBookId) REFERENCES user_books (id) ON DELETE CASCADE,
        UNIQUE(bookshelfId, userBookId)
      );

      -- フォローテーブル
      CREATE TABLE follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        followerId INTEGER NOT NULL,
        followeeId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (followerId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (followeeId) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(followerId, followeeId)
      );

      -- ブロックテーブル
      CREATE TABLE blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blockerId INTEGER NOT NULL,
        blockedId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blockerId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (blockedId) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(blockerId, blockedId)
      );

      -- インデックス作成
      CREATE INDEX idx_users_firebase_uid ON users(firebaseUid);
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_books_isbn ON books(isbn);
      CREATE INDEX idx_user_books_user_id ON user_books(userId);
      CREATE INDEX idx_user_books_book_id ON user_books(bookId);
      CREATE INDEX idx_bookshelves_user_id ON bookshelves(userId);
      CREATE INDEX idx_bookshelf_books_bookshelf_id ON bookshelf_books(bookshelfId);
    `;

    this.db.exec(schema);
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
      this.db.prepare(`DELETE FROM ${table}`).run();
    }

    // Auto incrementをリセット
    for (const table of tables) {
      this.db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
    }

    console.log('🗑️ 全テーブルデータクリア完了');
  }

  /**
   * テストユーザーの挿入
   */
  insertTestUsers() {
    const stmt = this.db.prepare(`
      INSERT INTO users (firebaseUid, email, username)
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
    const stmt = this.db.prepare(`
      INSERT INTO books (isbn, title, author, publisher, publishedDate, description, pageCount, thumbnail)
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
    const stmt = this.db.prepare(`
      INSERT INTO user_books (userId, bookId, isRead)
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
    const stmt = this.db.prepare(`
      INSERT INTO bookshelves (userId, name, description, isPublic)
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
      const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
      counts[table] = result.count;
    }

    return counts;
  }

  /**
   * 特定ユーザーのデータ取得
   */
  getUserData(userId: number) {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const books = this.db.prepare(`
      SELECT ub.*, b.* FROM user_books ub
      JOIN books b ON ub.bookId = b.id
      WHERE ub.userId = ?
    `).all(userId);
    const bookshelves = this.db.prepare('SELECT * FROM bookshelves WHERE userId = ?').all(userId);

    return { user, books, bookshelves };
  }

  /**
   * トランザクション実行
   */
  transaction<T>(callback: (db: Database.Database) => T): T {
    const transaction = this.db.transaction(callback);
    return transaction(this.db);
  }

  /**
   * データベースのクローズ
   */
  close() {
    this.db.close();
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
 * データベーステストアサーション
 */
export const dbAssertions = {
  /**
   * テーブルの行数確認
   */
  expectTableCount: (testDb: TestDatabase, table: string, expectedCount: number) => {
    const result = testDb.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
    expect(result.count).toBe(expectedCount);
  },

  /**
   * レコードの存在確認
   */
  expectRecordExists: (testDb: TestDatabase, table: string, condition: Record<string, any>) => {
    const conditions = Object.keys(condition).map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(condition);
    const result = testDb.db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${conditions}`).get(...values) as { count: number };
    expect(result.count).toBeGreaterThan(0);
  },

  /**
   * レコードの非存在確認
   */
  expectRecordNotExists: (testDb: TestDatabase, table: string, condition: Record<string, any>) => {
    const conditions = Object.keys(condition).map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(condition);
    const result = testDb.db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${conditions}`).get(...values) as { count: number };
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