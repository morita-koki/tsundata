/**
 * Jest Configuration for TypeScript + ES Modules
 * 本棚アプリバックエンド用テスト設定
 */

export default {
  // TypeScript + ES Modules 対応
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  
  // Node.js環境でテスト実行
  testEnvironment: 'node',
  
  // テストファイルのパターン
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts',
    '**/*.spec.ts'
  ],
  
  // TypeScript設定
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ES2022',
        target: 'ES2022',
        moduleResolution: 'bundler',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }],
    '^.+\\.js$': ['ts-jest', {
      useESM: true
    }]
  },
  
  // モジュール解決設定
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // カバレッジ設定
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.js',
    '!src/index.ts',
    '!src/**/index.ts'
  ],
  
  // カバレッジ閾値
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // カバレッジレポート形式
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // テスト実行前のグローバル設定（一時的に無効化）
  // globalSetup: '<rootDir>/src/__tests__/globalSetup.ts',
  // globalTeardown: '<rootDir>/src/__tests__/globalTeardown.ts',
  
  // 並列実行設定
  maxWorkers: '50%',
  
  // タイムアウト設定（30秒）
  testTimeout: 30000,
  
  // 詳細出力設定
  verbose: true,
  
  // 環境変数
  setupFiles: ['<rootDir>/src/__tests__/env.setup.ts'],
  
  // SQLite インメモリDB用の設定
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // クリアモック設定
  clearMocks: true,
  restoreMocks: true,
  
  // エラー時の詳細表示
  errorOnDeprecated: true,
  
  // ESM パッケージの変換を許可
  transformIgnorePatterns: [
    'node_modules/(?!(axios|drizzle-orm|better-sqlite3)/)'
  ]
};