'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import BookList from '@/components/BookList';
import LoadingPage from '@/components/LoadingPage';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/contexts/PageContext';
import { useBookLibrary } from '@/hooks/useBookLibrary';
import { useBookStatus } from '@/hooks/useBookStatus';

export default function AllBooksPage() {
  const router = useRouter();
  const { toasts, removeToast } = useToast();
  const { setPageTitle } = usePageTitle();
  
  // 書籍ライブラリ管理
  const {
    allBooks,
    stats,
    isLoading,
    refreshBooks,
    getTransformedBooks,
  } = useBookLibrary();
  
  // 読了状態管理
  const { updateReadStatus } = useBookStatus({
    onStatusUpdate: refreshBooks, // ステータス更新後に書籍データを再読み込み
  });

  useEffect(() => {
    setPageTitle('全ての本');
  }, [setPageTitle]);

  const transformedBooks = getTransformedBooks();

  if (isLoading) {
    return <LoadingPage text="書籍一覧を読み込み中..." />;
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">全ての本</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>全{stats.totalBooks}冊</span>
              <span>•</span>
              <span className="text-green-600">読了 {stats.readBooks}冊</span>
              <span>•</span>
              <span className="text-orange-600">未読 {stats.unreadBooks}冊</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
          >
            ← ホームに戻る
          </button>
        </div>
        
        {allBooks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">本がありません</h3>
            <p className="text-gray-500">本を追加して読書を始めましょう！</p>
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