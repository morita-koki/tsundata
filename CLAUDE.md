# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Guidelines

- Notion の Issue を参照して、取り組むべきタスクを確認してください。
- いきなり取り組むのではなく、読み込んだタスク内容を整理して、実際のコードと比較して、必要に応じて取り組み内容を調整してください。
- 取り組むべき内容とタスクの終了条件が整理できれば、一度、僕に確認を取ってください。
- 僕の確認が取れたら、まずは GitHub に Issue を作成してください。
- Issue には現状の課題、取り組む内容（修正方法案）、終了条件を明記してください。
- 終了の絶対条件としてテストがきちんと通ることを責務として課します。うまくいかないからテストの方を修正して辻褄を合わせる、ということはしないでください。
- Issue が作成できたら、`develop` branch を最新に更新し、`develop` branch から適切に branch を作成してください。
  - branch 名は `issue-<issue番号>/<内容>` の形式で作成してください。
  - 例: `issue-123/fix-user-authentication`
- コードの修正が完了したら、必ずテストを実行して、全てのテストが通ることを確認してください。
- テストが通ることが確認できれば、GitHub の PR を作成してください。
- PR には、Issue への参照を明記し、取り組んだ内容、修正したコード、追加したライブラリや機能について、詳細に説明してください。
- PR が出せれば、僕にレビューを依頼してください。
- PR のレビューが完了したら、レビュー内容を反映して修正を繰り返してください。
- マージは僕が行いますので、PR のマージは行わないでください。

## MCP rules

- github の MCP は user 名 morita-koki, repo 名 tsundata
- notion の MCP は tsundata のページへのアクセスを許可しています。
  - issue は issue database に保存してください
  - document は document database に保存してください

## Common Development Commands

### Docker Environment (Recommended)

```bash
# Quick setup with HTTPS (installs dependencies automatically)
make https

# Or manual setup
docker compose up -d

# Other useful commands
make up              # Start all services
make down            # Stop all services
make logs            # View all logs
make restart         # Restart services
make clean           # Clean containers and volumes

# Package management (if needed)
docker compose exec backend npm install [package]
docker compose exec frontend npm install [package]

# Testing
docker compose exec backend npm test                    # Run all tests
docker compose exec backend npm run test:watch         # Run tests in watch mode
docker compose exec backend npm run test:coverage      # Run tests with coverage
docker compose exec backend npm run test:verbose       # Run tests with detailed output

# Run specific tests
docker compose exec backend npm test -- --testPathPatterns="UserRepository"
docker compose exec backend npm test -- --testPathPatterns="environment"
docker compose exec backend npm test -- --testNamePattern="createUser"
```

### Direct Development (Alternative - Not Recommended)

**Note**: Direct development requires manual dependency management and lacks HTTPS setup needed for camera features.

**Backend (Node.js/Express)**:

- docker compose コマンドを使ってください

**Frontend (Next.js)**:

- docker compose コマンドを使ってください

## Architecture Overview

This is a Japanese bookshelf management application (本棚アプリ) with barcode scanning capabilities.

### Tech Stack

- **Backend**: Node.js, Express.js, Drizzle ORM, SQLite, Firebase Auth
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, html5-qrcode
- **Infrastructure**: Docker, Nginx (reverse proxy with HTTPS), Alpine Linux

### Development Environment

The application runs in a containerized environment with 4 services:

- **Database**: SQLite with persistent volume
- **Backend**: Node.js API server (port 3001)
- **Frontend**: Next.js application (port 3000)
- **Nginx**: Reverse proxy with SSL termination (ports 80/443)

**Access URL**: https://localhost (HTTPS required for camera/barcode features)

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

SQLite database with tables: users, books, user_books, bookshelves, bookshelf_books, follows, blocks. Uses hybrid approach: raw SQL for table creation in `database.js`, Drizzle ORM for data operations and type safety.

### Authentication Flow

Uses Firebase Authentication with custom backend user sync. Frontend gets Firebase tokens and passes them to backend via Authorization header.

## Environment Variables

Environment variables are managed in a single `.env` file at the project root:

**Required Variables** (copy from `.env.example`):

- `JWT_SECRET` - JWT signing secret for backend authentication
- `GOOGLE_BOOKS_API_KEY` - Google Books API key
- `NEXT_PUBLIC_API_URL` - Backend API URL (https://localhost/api for Docker setup)
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID

**Setup**: `cp .env.example .env` and edit the values accordingly. The Docker environment uses HTTPS by default for camera access compatibility.

## API Endpoints

Main API routes:

- `/api/auth/*` - User registration, login, profile sync
- `/api/books/*` - ISBN search, library management, read status
- `/api/users/*` - Statistics, follow/unfollow, block/unblock, search
- `/api/bookshelves/*` - Bookshelf CRUD, book management, visibility settings
