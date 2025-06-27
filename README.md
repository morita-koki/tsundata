# 本棚アプリ

バーコード読み取り機能付きの読書管理アプリです。

## 機能

- ユーザー登録・ログイン
- バーコード読み取りによる本の追加
- 本の情報取得（Google Books API連携）
- 読書状況の管理（読了・未読）
- 統計情報の表示（未読本数、合計金額等）
- 本棚の作成・管理
- 本棚の公開・非公開設定
- ユーザーフォロー・ブロック機能

## 技術スタック

### バックエンド
- Node.js
- Express.js
- Drizzle ORM
- SQLite
- JWT認証

### フロントエンド
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- html5-qrcode (バーコード読み取り)

## セットアップ

### 前提条件
- Node.js 18以上
- npm

### 1. プロジェクトのクローン
```bash
cd bookshelf-app
```

### 2. 環境変数の設定
```bash
# プロジェクトルートで環境変数ファイルを作成
cp .env.example .env
# .envファイルを編集して必要な値を設定
```

### 3. Dockerを使用した起動（推奨）
```bash
# プロジェクトルートで実行
docker-compose up -d
```

### 4. 個別セットアップ（開発用）

#### バックエンド
```bash
cd backend
npm install

# データベースのマイグレーション
npm run db:generate
npm run db:migrate

# サーバー起動
npm run dev
```

#### フロントエンド
```bash
cd frontend
npm install

# 開発サーバー起動
npm run dev
```

## 環境変数

プロジェクトルートの`.env`ファイルで一括管理されています。

### 必要な環境変数

`.env.example`をコピーして設定してください：

```bash
# JWT Secret Key for backend authentication
JWT_SECRET=your-jwt-secret-key-change-this-in-production

# Google Books API Key
GOOGLE_BOOKS_API_KEY=your-google-books-api-key

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789012345

# API URL for frontend
NEXT_PUBLIC_API_URL=https://localhost/api
```

### 設定手順

1. **JWT_SECRET**: 強力なランダム文字列を生成して設定
2. **GOOGLE_BOOKS_API_KEY**: [Google Cloud Console](https://console.cloud.google.com/)でBooks APIを有効にして取得
3. **Firebase設定**: [Firebase Console](https://console.firebase.google.com/)のプロジェクト設定から取得

### 注意事項

- `.env`ファイルは`.gitignore`に含まれており、Gitにコミットされません
- 本番環境では必ず強力なシークレットキーを使用してください
- Firebase設定の`NEXT_PUBLIC_`プレフィックスがついた変数はクライアントサイドで公開されます

### 従来の個別環境変数ファイル（非推奨）

**バックエンド** (`backend/.env`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## API仕様

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン

### 本
- `GET /api/books/search/:isbn` - ISBN検索
- `POST /api/books/add` - 本をライブラリに追加
- `GET /api/books/library` - ライブラリ取得
- `PATCH /api/books/read/:userBookId` - 読書状況更新

### ユーザー
- `GET /api/users/stats` - 統計情報取得
- `POST /api/users/follow/:userId` - フォロー
- `DELETE /api/users/unfollow/:userId` - フォロー解除
- `POST /api/users/block/:userId` - ブロック
- `DELETE /api/users/unblock/:userId` - ブロック解除
- `GET /api/users/search` - ユーザー検索

### 本棚
- `POST /api/bookshelves` - 本棚作成
- `GET /api/bookshelves` - 自分の本棚一覧
- `GET /api/bookshelves/public` - 公開本棚一覧
- `GET /api/bookshelves/:id` - 本棚詳細
- `POST /api/bookshelves/:id/books` - 本棚に本を追加
- `PATCH /api/bookshelves/:id` - 本棚の公開設定変更

## 使い方

1. アカウントを作成またはログイン
2. ダッシュボードで「バーコードをスキャン」ボタンをクリック
3. 本のバーコードをスキャンして本を追加
4. 読書状況を管理
5. 本棚を作成して本を整理
6. 本棚を公開して他のユーザーと共有

## 開発

### データベーススキーマの変更
```bash
cd backend
npm run db:generate
npm run db:migrate
```

### 本番ビルド
```bash
# フロントエンド
cd frontend
npm run build

# バックエンド
cd backend
npm start
```