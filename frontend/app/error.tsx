'use client';

import { useEffect } from 'react';
import Navigation from '@/components/Navigation';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="エラーが発生しました" />
      
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-9xl font-bold text-red-300 mb-4">500</div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            エラーが発生しました
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            申し訳ございません。予期しないエラーが発生しました。
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8 max-w-2xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  エラーの詳細
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error.message || '不明なエラーが発生しました。'}</p>
                  {error.digest && (
                    <p className="mt-1 text-xs">
                      エラーID: {error.digest}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="mr-2">🔄</span>
              再試行
            </button>
            
            <a
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="mr-2">🏠</span>
              ダッシュボードに戻る
            </a>
          </div>
          
          <div className="mt-12">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              トラブルシューティング
            </h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl mx-auto text-left">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium text-gray-900 mb-2">
                  🔄 ページの再読み込み
                </h3>
                <p className="text-sm text-gray-600">
                  一時的な問題の場合、ページを再読み込みすることで解決する場合があります。
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium text-gray-900 mb-2">
                  🕐 しばらく待つ
                </h3>
                <p className="text-sm text-gray-600">
                  サーバーの問題の場合、しばらく時間をおいてから再度お試しください。
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium text-gray-900 mb-2">
                  🔐 ログイン状態の確認
                </h3>
                <p className="text-sm text-gray-600">
                  ログインが切れている可能性があります。一度ログアウトして再ログインしてください。
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium text-gray-900 mb-2">
                  🌐 ネットワーク接続
                </h3>
                <p className="text-sm text-gray-600">
                  インターネット接続が安定していることを確認してください。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}