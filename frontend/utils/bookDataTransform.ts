/**
 * 本・本棚データの変換ユーティリティ
 */

import type { UserBook, BookshelfBook, Bookshelf } from '@/types/api';
import type { BookshelfStats } from '@/types/bookshelf';

/**
 * UserBook[]をBookshelfBook[]形式に変換
 * BookListコンポーネントで使用する形式に統一
 */
export function transformUserBooksToBookshelfBooks(userBooks: UserBook[]): BookshelfBook[] {
  return userBooks.map((userBook, index) => ({
    userBookId: userBook.id,
    addedAt: userBook.addedAt,
    displayOrder: index,
    isRead: userBook.isRead,
    readAt: userBook.readAt,
    book: userBook.book,
  }));
}

/**
 * 本棚の統計情報を計算
 */
export function calculateBookshelfStats(bookshelf: Bookshelf): BookshelfStats {
  const books = bookshelf.books || [];
  const totalBooks = books.length;
  const readBooks = books.filter(book => book.isRead).length;
  const unreadBooks = totalBooks - readBooks;
  const totalValue = books.reduce((sum, book) => sum + (book.book.price || 0), 0);
  const unreadValue = books
    .filter(book => !book.isRead)
    .reduce((sum, book) => sum + (book.book.price || 0), 0);
  const readPercentage = totalBooks > 0 ? Math.round((readBooks / totalBooks) * 100) : 0;

  return {
    totalBooks,
    readBooks,
    unreadBooks,
    totalValue,
    unreadValue,
    readPercentage,
  };
}

/**
 * UserBook配列から未読の本のみを抽出
 */
export function filterUnreadBooks(userBooks: UserBook[]): UserBook[] {
  return userBooks.filter(book => !book.isRead);
}

/**
 * UserBook配列から読了済みの本のみを抽出
 */
export function filterReadBooks(userBooks: UserBook[]): UserBook[] {
  return userBooks.filter(book => book.isRead);
}

/**
 * 本棚配列から最初の数冊のサムネイルを取得
 */
export function extractBookshelfThumbnails(
  bookshelf: Bookshelf, 
  maxCount: number = 4
): string[] {
  const books = bookshelf.books || [];
  return books
    .slice(0, maxCount)
    .map(book => book.book.thumbnail)
    .filter(Boolean); // 空文字列やnullを除外
}

/**
 * 本のタイトルを指定文字数で切り詰め
 */
export function truncateTitle(title: string, maxLength: number = 50): string {
  if (title.length <= maxLength) {
    return title;
  }
  return title.substring(0, maxLength - 3) + '...';
}

/**
 * 価格を日本円形式でフォーマット
 */
export function formatPrice(price: number): string {
  if (price === 0 || !price) {
    return '価格不明';
  }
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(price);
}

/**
 * 日付文字列を相対時間で表示
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'たった今';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}時間前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}日前`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}ヶ月前`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}年前`;
}

/**
 * 本棚の公開状態に応じたラベル取得
 */
export function getVisibilityLabel(isPublic: boolean): {
  text: string;
  className: string;
} {
  return isPublic
    ? {
        text: '公開',
        className: 'bg-green-100 text-green-800',
      }
    : {
        text: '非公開',
        className: 'bg-gray-100 text-gray-800',
      };
}

/**
 * BookshelfBook配列をdisplayOrderでソート
 */
export function sortByDisplayOrder(books: BookshelfBook[]): BookshelfBook[] {
  return [...books].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * UserBook配列を追加日時でソート（新しい順）
 */
export function sortByAddedDate(books: UserBook[], ascending: boolean = false): UserBook[] {
  return [...books].sort((a, b) => {
    const dateA = new Date(a.addedAt).getTime();
    const dateB = new Date(b.addedAt).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}