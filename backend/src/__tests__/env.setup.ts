/**
 * テスト環境用環境変数設定
 * Jest実行前に読み込まれ、テスト専用の環境変数を設定
 */

// Node.js環境をテストモードに設定
process.env.NODE_ENV = 'test';

// テスト用データベース設定（インメモリSQLite）
process.env.DATABASE_URL = ':memory:';

// テスト用のJWTシークレット
process.env.JWT_SECRET = 'test-jwt-secret-key';

// ポート設定（テスト用）
process.env.PORT = '0'; // 自動ポート割り当て

// 外部API設定（テスト用 - 実際のAPI呼び出しを制限）
process.env.GOOGLE_BOOKS_API_KEY = 'test-google-books-api-key';

// Firebase設定（テスト用 - モック使用）
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nTEST_PRIVATE_KEY\n-----END PRIVATE KEY-----\n';

// ログレベル設定（テスト中は警告以上のみ）
process.env.LOG_LEVEL = 'warn';

// 外部API呼び出し無効化フラグ
process.env.DISABLE_EXTERNAL_APIS = 'true';

// タイムアウト設定
process.env.API_TIMEOUT = '5000';

// テスト実行中であることを示すフラグ
process.env.RUNNING_TESTS = 'true';

console.log('🧪 テスト環境設定が読み込まれました');