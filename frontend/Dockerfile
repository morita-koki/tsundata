FROM node:18-alpine

WORKDIR /app

# 依存関係をコピーしてインストール
COPY package*.json ./
RUN npm install

# アプリケーションコードをコピー
COPY . .

# Next.jsのキャッシュディレクトリを作成
RUN mkdir -p .next

EXPOSE 3000

# 開発環境用のデフォルトコマンド
CMD ["npm", "run", "dev"]