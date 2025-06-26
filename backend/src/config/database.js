import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../models/index.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../db/bookshelf.db');
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export async function initializeDatabase() {
  try {
    // Check if migrations folder exists and has files
    const migrationsPath = path.join(__dirname, '../../db/migrations');
    
    // Simple table creation instead of migrations for now
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS books (
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
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        is_read INTEGER DEFAULT 0,
        added_at INTEGER NOT NULL,
        read_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS bookshelves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        is_public INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS bookshelf_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bookshelf_id INTEGER NOT NULL,
        user_book_id INTEGER NOT NULL,
        added_at INTEGER NOT NULL,
        display_order INTEGER DEFAULT 0,
        FOREIGN KEY (bookshelf_id) REFERENCES bookshelves (id) ON DELETE CASCADE,
        FOREIGN KEY (user_book_id) REFERENCES user_books (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER NOT NULL,
        following_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blocker_id INTEGER NOT NULL,
        blocked_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (blocker_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (blocked_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);
    
    // Add display_order column if it doesn't exist
    try {
      sqlite.exec(`ALTER TABLE bookshelf_books ADD COLUMN display_order INTEGER DEFAULT 0;`);
      console.log('Added display_order column to bookshelf_books table');
    } catch (error) {
      // Column might already exist, ignore the error
      if (!error.message.includes('duplicate column name')) {
        console.log('display_order column already exists or other error:', error.message);
      }
    }
    
    // Update existing records with display_order based on added_at
    sqlite.exec(`
      UPDATE bookshelf_books 
      SET display_order = (
        SELECT COUNT(*) 
        FROM bookshelf_books b2 
        WHERE b2.bookshelf_id = bookshelf_books.bookshelf_id 
        AND b2.added_at <= bookshelf_books.added_at
      ) - 1
      WHERE display_order = 0;
    `);
    
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}