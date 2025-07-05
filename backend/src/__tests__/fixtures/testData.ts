/**
 * テストデータ定義
 * 単体テスト・統合テストで使用する共通テストデータ
 */

import type { User, Book, UserBook, Bookshelf } from '../../types/database.js';
import type { ExternalBookData } from '../../types/api.js';

/**
 * 新しいテスト構造 - リポジトリテスト用
 */
export const TEST_USERS = {
  USER1: {
    firebaseUid: 'test-firebase-uid-alice',
    email: 'alice@example.com',
    username: 'alice_user',
  },
  USER2: {
    firebaseUid: 'test-firebase-uid-bob',
    email: 'bob@example.com',
    username: 'bob_user',
  },
  USER3: {
    firebaseUid: 'test-firebase-uid-charlie',
    email: 'charlie@example.com',
    username: 'charlie_user',
  },
};

export const TEST_BOOKS = {
  BOOK1: {
    isbn: '9784797382570',
    title: 'JavaScript完全ガイド',
    author: 'David Flanagan',
    publisher: 'オライリー・ジャパン',
    publishedDate: '2021-01-01',
    description: 'JavaScript言語の完全なリファレンス',
    thumbnail: 'https://example.com/js-guide.jpg',
    price: 4950,
  },
  BOOK2: {
    isbn: '9784048930598',
    title: 'TypeScriptプログラミング',
    author: '鈴木一郎',
    publisher: 'KADOKAWA',
    publishedDate: '2023-01-01',
    description: 'TypeScriptの基礎から応用まで',
    thumbnail: 'https://example.com/ts-programming.jpg',
    price: 3300,
  },
  BOOK3: {
    isbn: '9784873119038',
    title: 'データベース設計入門',
    author: '田中花子',
    publisher: 'オライリー・ジャパン',
    publishedDate: '2020-01-01',
    description: 'データベース設計の基本から応用まで',
    thumbnail: 'https://example.com/db-design.jpg',
    price: 3850,
  },
};

export const TEST_BOOKSHELVES = {
  BOOKSHELF1: {
    name: 'プログラミング書籍',
    description: 'プログラミング関連の技術書',
    isPublic: true,
  },
  BOOKSHELF2: {
    name: 'お気に入り',
    description: '個人的なお気に入りの本',
    isPublic: false,
  },
  BOOKSHELF3: {
    name: 'データベース関連',
    description: 'データベースに関する書籍',
    isPublic: true,
  },
};

/**
 * テスト用ユーザーデータ
 */
export const testUsers: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    firebaseUid: 'test-firebase-uid-1',
    email: 'user1@example.com',
    username: 'testuser1',
  },
  {
    firebaseUid: 'test-firebase-uid-2',
    email: 'user2@example.com',
    username: 'testuser2',
  },
  {
    firebaseUid: 'test-firebase-uid-3',
    email: 'user3@example.com',
    username: 'testuser3',
  }
];

/**
 * テスト用書籍データ
 */
export const testBooks: Omit<Book, 'id' | 'createdAt'>[] = [
  {
    isbn: '9784797382570',
    title: 'リーダブルコード',
    author: 'Dustin Boswell, Trevor Foucher',
    publisher: 'オライリージャパン',
    publishedDate: '2012-06-23',
    description: 'より良いコードを書くための実践テクニック',
    pageCount: 260,
    thumbnail: 'https://example.com/book1.jpg'
  },
  {
    isbn: '9784048930598',
    title: 'TypeScript入門',
    author: '山田太郎',
    publisher: 'KADOKAWA',
    publishedDate: '2023-01-15',
    description: 'TypeScriptの基礎から応用まで',
    pageCount: 320,
    thumbnail: 'https://example.com/book2.jpg'
  },
  {
    isbn: '9784873119038',
    title: 'データベース実践入門',
    author: '奥野幹也',
    publisher: 'オライリージャパン',
    publishedDate: '2015-04-11',
    description: 'MySQLを使って学ぶ設計・構築・運用の基盤',
    pageCount: 312,
    thumbnail: 'https://example.com/book3.jpg'
  }
];

/**
 * テスト用外部API書籍データ
 */
export const testExternalBooks: ExternalBookData[] = [
  {
    isbn: '9784797382570',
    title: 'リーダブルコード',
    author: 'Dustin Boswell, Trevor Foucher',
    publisher: 'オライリージャパン',
    publishedDate: '2012-06-23',
    description: 'より良いコードを書くための実践テクニック',
    pageCount: 260,
    thumbnail: 'https://example.com/book1.jpg',
    price: 2640
  },
  {
    isbn: '9784048930598',
    title: 'TypeScript入門',
    author: '山田太郎',
    publisher: 'KADOKAWA',
    publishedDate: '2023-01-15',
    description: 'TypeScriptの基礎から応用まで',
    pageCount: 320,
    thumbnail: 'https://example.com/book2.jpg',
    price: 3200
  }
];

/**
 * テスト用ユーザー書籍データ
 */
export const testUserBooks: Omit<UserBook, 'id' | 'addedAt' | 'readAt'>[] = [
  {
    userId: 1,
    bookId: 1,
    isRead: true
  },
  {
    userId: 1,
    bookId: 2,
    isRead: false
  },
  {
    userId: 2,
    bookId: 1,
    isRead: false
  }
];

/**
 * テスト用本棚データ
 */
export const testBookshelves: Omit<Bookshelf, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    userId: 1,
    name: 'プログラミング',
    description: 'プログラミング関連の書籍',
    isPublic: true
  },
  {
    userId: 1,
    name: 'お気に入り',
    description: 'お気に入りの本',
    isPublic: false
  },
  {
    userId: 2,
    name: '技術書',
    description: '技術系の書籍コレクション',
    isPublic: true
  }
];

/**
 * テスト用ISBN一覧
 */
export const testISBNs = {
  valid: {
    isbn10: '4797382570',
    isbn13: '9784797382570',
    japanese: '9784048930598',
    english: '9780596517748'
  },
  invalid: {
    wrongChecksum: '9784797382571',
    wrongLength: '978479738257',
    wrongFormat: 'abc-def-ghi-jkl',
    empty: ''
  }
};

/**
 * テスト用リクエストデータ
 */
export const testRequests = {
  // 認証関連
  auth: {
    validToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidXNlcjFAZXhhbXBsZS5jb20iLCJpYXQiOjE2MzQ1Njc4OTB9.test',
    invalidToken: 'invalid-token',
    expiredToken: 'expired-token'
  },
  
  // 書籍関連
  books: {
    addToLibrary: {
      isbn: '9784797382570'
    },
    updateReadingStatus: {
      isRead: true
    },
    searchQuery: 'TypeScript'
  },
  
  // 本棚関連
  bookshelves: {
    create: {
      name: 'テスト本棚',
      description: 'テスト用の本棚です',
      isPublic: false
    },
    update: {
      name: '更新された本棚',
      description: '更新されたテスト用本棚',
      isPublic: true
    },
    addBook: {
      userBookId: 1,
      displayOrder: 0
    }
  }
};

/**
 * テスト用レスポンスデータ
 */
export const testResponses = {
  // 外部API
  ndlApi: {
    success: `<?xml version="1.0" encoding="UTF-8"?>
      <searchRetrieveResponse>
        <numberOfRecords>1</numberOfRecords>
        <records>
          <record>
            <recordData>
              <dcterms:title>リーダブルコード</dcterms:title>
              <dc:creator>Dustin Boswell</dc:creator>
              <dc:publisher>オライリージャパン</dc:publisher>
              <dcterms:issued>2012-06-23</dcterms:issued>
            </recordData>
          </record>
        </records>
      </searchRetrieveResponse>`,
    notFound: `<?xml version="1.0" encoding="UTF-8"?>
      <searchRetrieveResponse>
        <numberOfRecords>0</numberOfRecords>
        <records></records>
      </searchRetrieveResponse>`
  },
  
  googleBooksApi: {
    success: {
      items: [{
        volumeInfo: {
          title: 'TypeScript入門',
          authors: ['山田太郎'],
          publisher: 'KADOKAWA',
          publishedDate: '2023-01-15',
          description: 'TypeScriptの基礎から応用まで',
          pageCount: 320,
          imageLinks: {
            thumbnail: 'https://example.com/book2.jpg'
          }
        }
      }]
    },
    notFound: {
      totalItems: 0,
      items: []
    }
  }
};