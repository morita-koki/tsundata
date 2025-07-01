'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import LoadingPage from '@/components/LoadingPage';
import BookshelfDetailHeader from '@/components/BookshelfDetailHeader';
import BookshelfDetailContent from '@/components/BookshelfDetailContent';
import BookshelfAddBookModal from '@/components/BookshelfAddBookModal';
import BookshelfDetailEditModal from '@/components/BookshelfDetailEditModal';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/contexts/PageContext';
import { useBookshelfDetail } from '@/hooks/useBookshelfDetail';
import { useBookshelfDetailModals } from '@/hooks/useBookshelfDetailModals';
import { DIALOG_MESSAGES } from '@/constants/messages';

export default function BookshelfDetailPage() {
  const params = useParams();
  const bookshelfId = Number(params.id);
  const { toasts, removeToast } = useToast();
  const { setPageTitle } = usePageTitle();
  
  // 本棚詳細データ管理
  const {
    bookshelf,
    userBooks,
    isOwner,
    isEditMode,
    isLoading,
    updateBookshelf,
    addBookToBookshelf,
    removeBookFromBookshelf,
    enterEditMode,
    exitEditMode,
  } = useBookshelfDetail(bookshelfId);
  
  // モーダル管理
  const {
    showAddBookModal,
    showEditModal,
    bookRemoval,
    openAddBookModal,
    closeAddBookModal,
    openEditModal,
    closeEditModal,
    startBookRemoval,
    cancelBookRemoval,
    confirmBookRemoval,
  } = useBookshelfDetailModals(removeBookFromBookshelf);

  useEffect(() => {
    if (bookshelf) {
      setPageTitle(bookshelf.name);
    }
  }, [bookshelf, setPageTitle]);

  // ハンドラー関数
  const handleAddBook = async (userBookId: number) => {
    await addBookToBookshelf(userBookId);
    closeAddBookModal();
  };

  const handleUpdateBookshelf = async (name: string, description: string, isPublic: boolean) => {
    await updateBookshelf(name, description, isPublic);
    closeEditModal();
  };

  const handleEnterEditMode = () => {
    closeEditModal();
    enterEditMode();
  };

  if (isLoading) {
    return <LoadingPage text="本棚の詳細を読み込み中..." />;
  }

  if (!bookshelf) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">本棚が見つかりません</div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto w-full">
        <BookshelfDetailHeader
          bookshelf={bookshelf}
          isOwner={isOwner}
          onEdit={openEditModal}
        />
        
        <BookshelfDetailContent
          bookshelf={bookshelf}
          isOwner={isOwner}
          isEditMode={isEditMode}
          onRemoveBook={startBookRemoval}
          onExitEditMode={exitEditMode}
        />
      </div>

      <BookshelfAddBookModal
        isOpen={showAddBookModal}
        userBooks={userBooks}
        onClose={closeAddBookModal}
        onAddBook={handleAddBook}
      />
      
      <BookshelfDetailEditModal
        isOpen={showEditModal}
        bookshelf={bookshelf}
        onClose={closeEditModal}
        onSave={handleUpdateBookshelf}
        onEnterEditMode={handleEnterEditMode}
      />
      
      <ConfirmDialog
        isOpen={!!bookRemoval.removeBookId}
        title={DIALOG_MESSAGES.REMOVE_BOOK_FROM_BOOKSHELF.title}
        message={DIALOG_MESSAGES.REMOVE_BOOK_FROM_BOOKSHELF.message(bookRemoval.removeBookTitle)}
        confirmText={DIALOG_MESSAGES.REMOVE_BOOK_FROM_BOOKSHELF.confirmText}
        onConfirm={confirmBookRemoval}
        onCancel={cancelBookRemoval}
        isDangerous
      />
      
      {/* Floating Action Button */}
      {(() => {
        console.log('📱 FAB render check:', { isOwner, bookshelf: bookshelf?.name });
        return isOwner && (
          <button
            onClick={openAddBookModal}
            className="fixed bottom-6 right-6 w-16 h-16 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 flex items-center justify-center hover:scale-110"
            title="本を追加"
          >
            <span className="text-2xl">📚</span>
          </button>
        );
      })()}

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