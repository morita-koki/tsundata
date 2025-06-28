FROM node:18-alpine

# wgetをインストール（ヘルスチェック用）
RUN apk add --no-cache wget

WORKDIR /app

# 依存関係をコピーしてインストール
COPY package*.json ./
RUN npm install

# アプリケーションコードをコピー
COPY . .

# データディレクトリを作成
RUN mkdir -p /data

EXPOSE 3001

# 開発環境用のデフォルトコマンド
CMD ["npm", "run", "dev"]