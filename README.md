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

### 2. バックエンドのセットアップ
```bash
cd backend
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な値を設定

# データベースのマイグレーション
npm run db:generate
npm run db:migrate

# サーバー起動
npm run dev
```

### 3. フロントエンドのセットアップ
```bash
cd frontend
npm install

# 開発サーバー起動
npm run dev
```

## 環境変数

### バックエンド (.env)
```
PORT=3001
JWT_SECRET=your-jwt-secret-key
DATABASE_URL=./db/bookshelf.db
GOOGLE_BOOKS_API_KEY=your-google-books-api-key
```

### フロントエンド (.env.local)
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