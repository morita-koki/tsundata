#!/bin/bash

set -e

echo "🚀 本棚アプリ HTTPS開発環境セットアップ"
echo "========================================"

# 依存関係チェック
command -v docker >/dev/null 2>&1 || { echo "❌ Dockerが必要です"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "❌ Docker Compose (v2)が必要です"; exit 1; }

# SSL証明書生成
echo "🔐 SSL証明書を生成中..."
if [ ! -f nginx/ssl/localhost.crt ]; then
    ./generate-ssl.sh
else
    echo "✅ SSL証明書は既に存在します"
fi

# 必要なディレクトリを作成
echo "📁 必要なディレクトリを作成中..."
mkdir -p nginx/logs

# 既存のコンテナを停止
echo "🛑 既存のコンテナを停止中..."
docker compose down 2>/dev/null || true

# イメージをビルドして起動
echo "🐳 Dockerコンテナをビルド・起動中..."
docker compose up --build -d

# ヘルスチェック
echo "🔍 サービスの起動を待機中..."
sleep 10

# コンテナの状態確認
echo "📊 コンテナの状態："
docker compose ps

echo ""
echo "✅ セットアップ完了！"
echo "📱 https://localhost でアクセスしてカメラ機能をテストしてください"
echo "⚠️  初回アクセス時は自己署名証明書の警告が表示されます"
echo ""
echo "🛠️  便利なコマンド:"
echo "  - 全ログ確認:      make logs"
echo "  - バックエンドログ: make logs-backend"
echo "  - フロントエンドログ: make logs-frontend"
echo "  - 停止:           make down"
echo "  - 再起動:         make restart"
echo "  - ヘルプ:         make help"
echo ""
echo "🔧 トラブルシューティング:"
echo "  - ポート競合: make down && make up"
echo "  - 完全リセット: make clean && make up"