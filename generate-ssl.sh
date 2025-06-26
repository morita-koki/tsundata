#!/bin/bash

# SSL証明書ディレクトリを作成
mkdir -p nginx/ssl

# 自己署名証明書を生成
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/localhost.key \
  -out nginx/ssl/localhost.crt \
  -subj "/C=JP/ST=Tokyo/L=Tokyo/O=Development/OU=IT Department/CN=localhost"

echo "SSL証明書が生成されました: nginx/ssl/"
echo "ブラウザで https://localhost にアクセスしてください"
echo "自己署名証明書の警告が表示されたら「詳細設定」→「localhost にアクセスする（安全ではありません）」をクリックしてください"