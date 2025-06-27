'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { bookApi, userApi, bookshelfApi, Stats, UserBook, Bookshelf } from '@/lib/api';
import BarcodeScanner from '@/components/BarcodeScanner';
import Toast from '@/components/Toast';
import StatsDisplay from '@/components/StatsDisplay';
import BookList from '@/components/BookList';
import LoadingPage from '@/components/LoadingPage';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/contexts/PageContext';
import { useInitialMinimumLoading } from '@/hooks/useMinimumLoading';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [allBooks, setAllBooks] = useState<UserBook[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const router = useRouter();
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
  const { setPageTitle } = usePageTitle();

  const loadData = async () => {
    console.log('📊 Loading dashboard data...');
    const [statsData, bookshelvesData, libraryData] = await Promise.all([
      userApi.getStats(),
      bookshelfApi.getAll(),
      bookApi.getLibrary()
    ]);
    
    console.log('📈 Stats data:', statsData);
    console.log('📚 Bookshelves data:', bookshelvesData);
    console.log('📖 Library data:', libraryData);
    
    setStats(statsData);
    setBookshelves(bookshelvesData);
    setAllBooks(libraryData);
  };

  const isLoading = useInitialMinimumLoading(loadData, []);

  useEffect(() => {
    setPageTitle('つんでーた');
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [setPageTitle]);

  const handleScan = useCallback(async (isbn: string) => {
    console.log(`📱 ISBN scanned: ${isbn}`);
    
    // スキャナーを即座に閉じる（非同期処理の前に実行）
    setShowScanner(false);
    
    try {
      console.log(`🔍 Searching for book with ISBN: ${isbn}`);
      const book = await bookApi.searchByISBN(isbn);
      console.log(`📖 Book found:`, book);
        
      console.log(`➕ Adding book to library - Book ID: ${book.id}`);
      const userBook = await bookApi.addToLibrary(book.id);
      console.log(`✅ Book added to library:`, userBook);
      
      // 新しく追加した本に book データを含める
      const userBookWithBook = {
        ...userBook,
        book: book
      };
      console.log(`📚 UserBook with book data:`, userBookWithBook);
      
      loadData(); // Refresh stats and data
      
      // 成功メッセージを表示
      showSuccess(`「${book.title}」をライブラリに追加しました！`);
    } catch (error: any) {
      console.error(`❌ Error in handleScan:`, error);
      console.error(`❌ Error response:`, error.response?.data);
      
      const errorMessage = error.response?.data?.error;
      
      if (errorMessage === 'Book already in your library') {
        // 重複エラーの場合は警告メッセージを表示
        showWarning('この本は既にライブラリに登録されています。');
      } else if (errorMessage === 'Book not found in any API') {
        // ISBN検索失敗の場合
        showError('この ISBN の本が見つかりませんでした。手動で追加するか、別のバーコードをお試しください。');
      } else {
        // その他のエラー
        showError(errorMessage || '本の追加に失敗しました');
      }
    }
  }, [showSuccess, showError, showWarning]);

  const handleUpdateReadStatus = async (userBookId: number, isRead: boolean) => {
    try {
      await bookApi.updateReadStatus(userBookId, isRead);
      loadData(); // Refresh data to show updated status
      showSuccess(isRead ? '本を読了に変更しました！' : '本を未読に変更しました');
    } catch (error: any) {
      console.error('Failed to update read status:', error);
      showError('読書状況の変更に失敗しました');
    }
  };

  const getBookshelfStats = (bookshelf: Bookshelf) => {
    const totalBooks = bookshelf.books?.length || 0;
    const readBooks = bookshelf.books?.filter(book => book.isRead).length || 0;
    const unreadBooks = totalBooks - readBooks;
    const totalValue = bookshelf.books?.reduce((sum, book) => sum + (book.book.price || 0), 0) || 0;
    const unreadValue = bookshelf.books?.filter(book => !book.isRead).reduce((sum, book) => sum + (book.book.price || 0), 0) || 0;

    return {
      totalBooks,
      readBooks,
      unreadBooks,
      totalValue,
      unreadValue
    };
  };

  // Show only unread books on homepage
  const unreadBooks = allBooks.filter(book => !book.isRead);
  
  // Transform UserBook[] to BookshelfBook[] format for BookList component
  const transformedBooks = unreadBooks.map((userBook, index) => ({
    userBookId: userBook.id,
    addedAt: userBook.addedAt,
    displayOrder: index,
    isRead: userBook.isRead,
    readAt: userBook.readAt,
    book: userBook.book
  }));

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
            onUpdateReadStatus={handleUpdateReadStatus}
          />
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowScanner(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 flex items-center justify-center hover:scale-110"
        title="バーコードをスキャンして本を追加"
      >
        <span className="text-2xl">📱</span>
      </button>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
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