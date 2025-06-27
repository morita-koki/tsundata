'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { bookApi, UserBook } from '@/lib/api';
import Toast from '@/components/Toast';
import BookList from '@/components/BookList';
import LoadingPage from '@/components/LoadingPage';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/contexts/PageContext';

export default function AllBooksPage() {
  const [user, setUser] = useState<any>(null);
  const [allBooks, setAllBooks] = useState<UserBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('全ての本');
    loadBooks();
  }, [setPageTitle]);

  const loadBooks = async () => {
    try {
      console.log('📖 Loading all books...');
      const libraryData = await bookApi.getLibrary();
      console.log('📚 Library data:', libraryData);
      setAllBooks(libraryData);
    } catch (error) {
      console.error('❌ Failed to load books:', error);
      showError('本の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReadStatus = async (userBookId: number, isRead: boolean) => {
    try {
      await bookApi.updateReadStatus(userBookId, isRead);
      loadBooks(); // Refresh data to show updated status
      showSuccess(isRead ? '本を読了に変更しました！' : '本を未読に変更しました');
    } catch (error: any) {
      console.error('Failed to update read status:', error);
      showError('読書状況の変更に失敗しました');
    }
  };

  // Transform UserBook[] to BookshelfBook[] format for BookList component
  const transformedBooks = allBooks.map((userBook, index) => ({
    userBookId: userBook.id,
    addedAt: userBook.addedAt,
    displayOrder: index,
    isRead: userBook.isRead,
    readAt: userBook.readAt,
    book: userBook.book
  }));

  const readBooks = allBooks.filter(book => book.isRead);
  const unreadBooks = allBooks.filter(book => !book.isRead);

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
              <span>全{allBooks.length}冊</span>
              <span>•</span>
              <span className="text-green-600">読了 {readBooks.length}冊</span>
              <span>•</span>
              <span className="text-orange-600">未読 {unreadBooks.length}冊</span>
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
            onUpdateReadStatus={handleUpdateReadStatus}
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