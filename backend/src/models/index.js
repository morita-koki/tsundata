import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  firebaseUid: text('firebase_uid').unique().notNull(),
  username: text('username').notNull(),
  email: text('email').unique().notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const books = sqliteTable('books', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  isbn: text('isbn').unique().notNull(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  publisher: text('publisher'),
  publishedDate: text('published_date'),
  description: text('description'),
  pageCount: integer('page_count'),
  thumbnail: text('thumbnail'),
  price: real('price'),
  series: text('series'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const userBooks = sqliteTable('user_books', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bookId: integer('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  readAt: integer('read_at', { mode: 'timestamp' }),
});

export const bookshelves = sqliteTable('bookshelves', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const bookshelfBooks = sqliteTable('bookshelf_books', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bookshelfId: integer('bookshelf_id').notNull().references(() => bookshelves.id, { onDelete: 'cascade' }),
  userBookId: integer('user_book_id').notNull().references(() => userBooks.id, { onDelete: 'cascade' }),
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  displayOrder: integer('display_order').default(0),
});

export const follows = sqliteTable('follows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  followerId: integer('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: integer('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const blocks = sqliteTable('blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  blockerId: integer('blocker_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  blockedId: integer('blocked_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  userBooks: many(userBooks),
  bookshelves: many(bookshelves),
  followers: many(follows, { relationName: 'followers' }),
  following: many(follows, { relationName: 'following' }),
  blockers: many(blocks, { relationName: 'blockers' }),
  blocked: many(blocks, { relationName: 'blocked' }),
}));

export const booksRelations = relations(books, ({ many }) => ({
  userBooks: many(userBooks),
}));

export const userBooksRelations = relations(userBooks, ({ one, many }) => ({
  user: one(users, {
    fields: [userBooks.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [userBooks.bookId],
    references: [books.id],
  }),
  bookshelfBooks: many(bookshelfBooks),
}));

export const bookshelvesRelations = relations(bookshelves, ({ one, many }) => ({
  user: one(users, {
    fields: [bookshelves.userId],
    references: [users.id],
  }),
  bookshelfBooks: many(bookshelfBooks),
}));

export const bookshelfBooksRelations = relations(bookshelfBooks, ({ one }) => ({
  bookshelf: one(bookshelves, {
    fields: [bookshelfBooks.bookshelfId],
    references: [bookshelves.id],
  }),
  userBook: one(userBooks, {
    fields: [bookshelfBooks.userBookId],
    references: [userBooks.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: 'followers',
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: 'following',
  }),
}));

export const blocksRelations = relations(blocks, ({ one }) => ({
  blocker: one(users, {
    fields: [blocks.blockerId],
    references: [users.id],
    relationName: 'blockers',
  }),
  blocked: one(users, {
    fields: [blocks.blockedId],
    references: [users.id],
    relationName: 'blocked',
  }),
}));