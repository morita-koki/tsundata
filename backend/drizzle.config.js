import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/models/index.js',
  out: './db/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './db/bookshelf.db',
  },
});