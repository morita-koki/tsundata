/**
 * Jest グローバルティアダウン
 * 全テスト実行後に一度だけ実行されるクリーンアップ処理
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * グローバルティアダウン関数
 */
export default async function globalTeardown() {
  console.log('🧹 テストスイート グローバルクリーンアップ開始');

  try {
    // テスト用一時ファイルのクリーンアップ
    await cleanupTempFiles();

    // テスト実行統計の出力
    printTestSummary();

    // リソースの解放
    cleanupResources();

    console.log('✅ グローバルクリーンアップ完了');
  } catch (error) {
    console.error('❌ グローバルクリーンアップ中にエラー:', error);
  }
}

/**
 * テスト用一時ファイルのクリーンアップ
 */
async function cleanupTempFiles() {
  const testTempDir = path.join(process.cwd(), 'tmp', 'test');
  
  try {
    // 一時ディレクトリが存在する場合は削除
    await fs.access(testTempDir);
    await fs.rm(testTempDir, { recursive: true, force: true });
    console.log(`🗑️ テスト用一時ディレクトリ削除: ${testTempDir}`);
  } catch (error) {
    // ディレクトリが存在しない場合は無視
    if ((error as any).code !== 'ENOENT') {
      console.warn('⚠️ 一時ディレクトリ削除に失敗:', error);
    }
  }

  // テスト中に作成された可能性のあるその他の一時ファイル
  const possibleTempFiles = [
    'test.db',
    'test.db-journal',
    'coverage-final.json'
  ];

  for (const fileName of possibleTempFiles) {
    try {
      const filePath = path.join(process.cwd(), fileName);
      await fs.access(filePath);
      await fs.unlink(filePath);
      console.log(`🗑️ 一時ファイル削除: ${fileName}`);
    } catch (error) {
      // ファイルが存在しない場合は無視
    }
  }
}

/**
 * テスト実行統計の出力
 */
function printTestSummary() {
  const endTime = Date.now();
  const startTime = process.env.TEST_START_TIME ? parseInt(process.env.TEST_START_TIME) : endTime;
  const duration = endTime - startTime;

  console.log('\n📊 テスト実行統計:');
  console.log(`⏱️ 実行時間: ${duration}ms`);
  console.log(`🧪 Node.js バージョン: ${process.version}`);
  console.log(`💾 メモリ使用量: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  
  // 環境情報
  console.log(`🌍 実行環境: ${process.env.NODE_ENV}`);
  console.log(`🔧 Jest バージョン: ${process.env.npm_package_devDependencies_jest || 'Unknown'}`);
}

/**
 * リソースの解放
 */
function cleanupResources() {
  // グローバルテストヘルパーのクリーンアップ
  if (global.testHelper) {
    delete global.testHelper;
    console.log('🛠️ グローバルテストヘルパー削除完了');
  }

  // 開いているハンドルの確認（開発時のデバッグ用）
  if (process.env.NODE_ENV === 'development') {
    // process._getActiveHandles() が利用可能な場合
    if (typeof (process as any)._getActiveHandles === 'function') {
      const handles = (process as any)._getActiveHandles();
      if (handles.length > 0) {
        console.warn(`⚠️ 開いているハンドル数: ${handles.length}`);
      }
    }
  }

  // プロセス終了時の追加設定
  process.removeAllListeners('exit');
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');

  console.log('🔄 プロセスリスナー削除完了');
}

// 予期しないエラーのキャッチ
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ テストクリーンアップ中の未処理の Promise 拒否:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ テストクリーンアップ中の未処理の例外:', error);
});