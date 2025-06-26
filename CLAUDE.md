# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Backend (Node.js/Express)
```bash
cd bookshelf-app/backend
npm install
npm run dev           # Start development server with nodemon
npm start            # Start production server
npm run db:generate  # Generate Drizzle schema
npm run db:migrate   # Run database migrations
```

### Frontend (Next.js)
```bash
cd bookshelf-app/frontend
npm install
npm run dev          # Start development server with turbo
npm run build        # Production build
npm start           # Start production server
npm run lint        # Run ESLint
```

## Architecture Overview

This is a Japanese bookshelf management application (本棚アプリ) with barcode scanning capabilities.

### Tech Stack
- **Backend**: Node.js, Express.js, Drizzle ORM, SQLite, Firebase Auth
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, html5-qrcode

### Key Components

**Backend Structure**:
- `src/index.js` - Express server entry point with route mounting
- `src/config/database.js` - SQLite database initialization and schema creation
- `src/config/firebase.js` - Firebase Admin SDK configuration
- `src/routes/` - API endpoints for auth, books, users, bookshelves
- `src/middleware/auth.js` - Firebase token verification
- `src/utils/bookSearch.js` - Google Books API integration

**Frontend Structure**:
- `app/` - Next.js App Router pages (dashboard, login, register, bookshelves)
- `components/BarcodeScanner.tsx` - QR/barcode scanning component using html5-qrcode
- `lib/api.ts` - Axios-based API client with Firebase token interceptor
- `lib/firebase.ts` - Firebase client configuration

### Database Schema
SQLite database with tables: users, books, user_books, bookshelves, bookshelf_books, follows, blocks. The database uses raw SQL for table creation rather than migrations.

### Authentication Flow
Uses Firebase Authentication with custom backend user sync. Frontend gets Firebase tokens and passes them to backend via Authorization header.

## Environment Variables

**Backend (.env)**:
- `PORT` - Server port (default 3001)
- `JWT_SECRET` - JWT signing secret
- `DATABASE_URL` - SQLite database path
- `GOOGLE_BOOKS_API_KEY` - Google Books API key

**Frontend (.env.local)**:
- `NEXT_PUBLIC_API_URL` - Backend API URL (default http://localhost:3001/api)

## API Endpoints

Main API routes:
- `/api/auth/*` - User registration, login, profile sync
- `/api/books/*` - ISBN search, library management, read status
- `/api/users/*` - Statistics, follow/unfollow, block/unblock, search
- `/api/bookshelves/*` - Bookshelf CRUD, book management, visibility settings