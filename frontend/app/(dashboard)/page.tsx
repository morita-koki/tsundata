'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BarcodeScanner from '@/components/BarcodeScanner';
import Toast from '@/components/Toast';
import StatsDisplay from '@/components/StatsDisplay';
import BookList from '@/components/BookList';
import LoadingPage from '@/components/LoadingPage';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/contexts/PageContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useBookScanner } from '@/hooks/useBookScanner';
import { useBookStatus } from '@/hooks/useBookStatus';

export default function HomePage() {
  const router = useRouter();
  const { toasts, removeToast } = useToast();
  const { setPageTitle } = usePageTitle();
  
  // ダッシュボードデータ管理
  const {
    stats,
    unreadBooks,
    isLoading,
    loadData,
    getTransformedUnreadBooks,
  } = useDashboard();
  
  // スキャナー機能
  const {
    isScanning,
    openScanner,
    closeScanner,
    handleScan,
  } = useBookScanner({
    onBookAdded: loadData, // 本が追加されたらダッシュボードデータを再読み込み
  });
  
  // 読了状態管理
  const { updateReadStatus } = useBookStatus({
    onStatusUpdate: loadData, // ステータス更新後にダッシュボードデータを再読み込み
  });

  useEffect(() => {
    setPageTitle('つんでーた');
  }, [setPageTitle]);

  const transformedBooks = getTransformedUnreadBooks();

  if (isLoading) {
    return <LoadingPage text="ダッシュボードを読み込み中..." />;
  }

  return (
    <>
      {/* Global Stats Section */}
      {stats && <StatsDisplay stats={stats} title="" />}

      {/* Books Section */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            積読リスト
            {unreadBooks.length > 0 && (
              <span className="ml-3 text-lg text-orange-600 font-medium">
                {unreadBooks.length}冊
              </span>
            )}
          </h2>
          <button
            onClick={() => router.push('/books')}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
          >
            すべての本を見る →
          </button>
        </div>
        
        {transformedBooks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">積読がありません</h3>
            <p className="text-gray-500">すべての本を読み終えました！素晴らしいです！</p>
          </div>
        ) : (
          <BookList
            books={transformedBooks}
            isOwner={true}
            isEditMode={false}
            onRemoveBook={() => {}}
            onUpdateReadStatus={updateReadStatus}
          />
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={openScanner}
        className="fixed bottom-6 right-6 w-16 h-16 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 flex items-center justify-center hover:scale-110"
        title="バーコードをスキャンして本を追加"
      >
        <span className="text-2xl">📱</span>
      </button>

      {isScanning && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={closeScanner}
        />
      )}

      {/* Toast notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}