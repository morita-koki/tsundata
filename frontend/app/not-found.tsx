import Navigation from '@/components/Navigation';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation title="ページが見つかりません" />
      
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-9xl font-bold text-gray-300 mb-4">404</div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ページが見つかりません
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
          
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <a
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="mr-2">🏠</span>
              ダッシュボードに戻る
            </a>
            
            <a
              href="/bookshelves"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="mr-2">📚</span>
              本棚一覧を見る
            </a>
          </div>
          
          <div className="mt-12">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              よく使われるページ
            </h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
              <a
                href="/dashboard"
                className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="text-center">
                  <span className="text-3xl mb-2 block">📊</span>
                  <span className="text-sm font-medium text-gray-900">
                    ダッシュボード
                  </span>
                </div>
              </a>
              
              <a
                href="/bookshelves"
                className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="text-center">
                  <span className="text-3xl mb-2 block">📚</span>
                  <span className="text-sm font-medium text-gray-900">
                    本棚一覧
                  </span>
                </div>
              </a>
              
              <a
                href="/login"
                className="group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="text-center">
                  <span className="text-3xl mb-2 block">🔐</span>
                  <span className="text-sm font-medium text-gray-900">
                    ログイン
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}