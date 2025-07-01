/**
 * Database entity types derived from Drizzle ORM schema
 */

export interface User {
  id: number;
  firebaseUid: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher?: string | null;
  publishedDate?: string | null;
  description?: string | null;
  pageCount?: number | null;
  thumbnail?: string | null;
  price?: number | null;
  series?: string | null;
  createdAt: Date;
}

export interface UserBook {
  id: number;
  userId: number;
  bookId: number;
  isRead: boolean;
  addedAt: Date;
  readAt?: Date | null;
}

export interface Bookshelf {
  id: number;
  userId: number;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: Date;
}

export interface BookshelfBook {
  id: number;
  bookshelfId: number;
  userBookId: number;
  addedAt: Date;
  displayOrder: number;
}

export interface Follow {
  id: number;
  followerId: number;
  followingId: number;
  createdAt: Date;
}

export interface Block {
  id: number;
  blockerId: number;
  blockedId: number;
  createdAt: Date;
}

// Insert types (for database inserts, without generated fields)
export type UserInsert = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export type BookInsert = Omit<Book, 'id' | 'createdAt'> & {
  createdAt?: Date;
};

export type UserBookInsert = Omit<UserBook, 'id' | 'addedAt'> & {
  addedAt?: Date;
};

export type BookshelfInsert = Omit<Bookshelf, 'id' | 'createdAt'> & {
  createdAt?: Date;
};

export type BookshelfBookInsert = Omit<BookshelfBook, 'id' | 'addedAt'> & {
  addedAt?: Date;
};

export type FollowInsert = Omit<Follow, 'id' | 'createdAt'> & {
  createdAt?: Date;
};

export type BlockInsert = Omit<Block, 'id' | 'createdAt'> & {
  createdAt?: Date;
};

// Update types (for database updates, with optional fields)
export type UserUpdate = Partial<Omit<User, 'id' | 'firebaseUid' | 'createdAt'>> & {
  updatedAt?: Date;
};

export type BookUpdate = Partial<Omit<Book, 'id' | 'isbn' | 'createdAt'>>;

export type UserBookUpdate = Partial<Omit<UserBook, 'id' | 'userId' | 'bookId' | 'addedAt'>>;

export type BookshelfUpdate = Partial<Omit<Bookshelf, 'id' | 'userId' | 'createdAt'>>;