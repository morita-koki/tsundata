/**
 * API関連の型定義
 * lib/api.tsから分離
 */

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  description: string;
  pageCount: number;
  thumbnail: string;
  price: number;
}

export interface UserBook {
  id: number;
  isRead: boolean;
  addedAt: string;
  readAt: string | null;
  book: Book;
}

export interface BookshelfBook {
  userBookId: number;
  addedAt: string;
  displayOrder: number;
  isRead: boolean;
  readAt: string | null;
  book: Book;
}

export interface Bookshelf {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  bookCount?: number;
  user?: {
    id: number;
    username: string;
  };
  books?: BookshelfBook[];
}

export interface BookshelfDetailResponse extends Bookshelf {
  books: Array<{
    id: number;
    userBookId: number;
    addedAt: string;
    displayOrder: number;
    book: Book;
    isRead: boolean;
  }>;
  user: {
    id: number;
    username: string;
  };
}

export interface Stats {
  totalBooks: number;
  unreadBooks: number;
  readBooks: number;
  totalValue: number;
  unreadValue: number;
}