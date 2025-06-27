'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { bookshelfApi, bookApi, Bookshelf, UserBook } from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import BookList from '@/components/BookList';
import Toast from '@/components/Toast';
import LoadingPage from '@/components/LoadingPage';
import { useToast } from '@/hooks/useToast';
import { usePageTitle } from '@/contexts/PageContext';

export default function BookshelfDetailPage() {
  const [bookshelf, setBookshelf] = useState<Bookshelf | null>(null);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [removeBookId, setRemoveBookId] = useState<number | null>(null);
  const [removeBookTitle, setRemoveBookTitle] = useState<string>('');
  const router = useRouter();
  const params = useParams();
  const bookshelfId = Number(params.id);
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    if (bookshelfId) {
      loadBookshelf();
    }
  }, [bookshelfId]);

  useEffect(() => {
    if (bookshelf) {
      setPageTitle(bookshelf.name);
    }
  }, [bookshelf, setPageTitle]);

  const loadBookshelf = async () => {
    try {
      const bookshelfData = await bookshelfApi.getById(bookshelfId);
      setBookshelf(bookshelfData);

      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        setIsOwner(bookshelfData.user?.id === user.id);
        
        if (bookshelfData.user?.id === user.id) {
          const libraryData = await bookApi.getLibrary();
          setUserBooks(libraryData);
        }
      }
    } catch (error) {
      console.error('Failed to load bookshelf:', error);
      alert('本棚の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const addBookToBookshelf = async (userBookId: number) => {
    try {
      await bookshelfApi.addBook(bookshelfId, userBookId);
      loadBookshelf();
      setShowAddBookModal(false);
      showSuccess('本を本棚に追加しました');
    } catch (error: any) {
      showError(error.response?.data?.error || '本の追加に失敗しました');
    }
  };

  const removeBookFromBookshelf = async () => {
    if (!removeBookId) return;
    
    try {
      await bookshelfApi.removeBook(bookshelfId, removeBookId);
      loadBookshelf();
      setRemoveBookId(null);
      setRemoveBookTitle('');
      showSuccess('本を本棚から削除しました');
    } catch (error: any) {
      showError('本の削除に失敗しました');
    }
  };

  const handleRemoveBook = (userBookId: number, title: string) => {
    setRemoveBookId(userBookId);
    setRemoveBookTitle(title);
  };

  const updateBookshelf = async (name: string, description: string, isPublic: boolean) => {
    try {
      await bookshelfApi.update(bookshelfId, name, description, isPublic);
      loadBookshelf();
      setShowEditModal(false);
      // Notify sidebar of the update
      window.dispatchEvent(new Event('bookshelfUpdated'));
      showSuccess('本棚を更新しました');
    } catch (error: any) {
      showError('本棚の更新に失敗しました');
    }
  };

  const enterEditMode = () => {
    setShowEditModal(false);
    setIsEditMode(true);
  };

  const exitEditMode = () => {
    setIsEditMode(false);
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
            <div className="mb-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-2">{bookshelf.name}</h2>
                {bookshelf.description && (
                  <p className="text-gray-600 mb-4">{bookshelf.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-500">作成者: {bookshelf.user?.username}</span>
                    <span className={`ml-4 px-2 py-1 rounded text-xs ${
                      bookshelf.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {bookshelf.isPublic ? '公開' : '非公開'}
                    </span>
                  </div>
                  
                  {isOwner && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                    >
                      編集
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">本棚の本 ({bookshelf.books?.length || 0}冊)</h3>
                {isEditMode && (
                  <button
                    onClick={exitEditMode}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    編集完了
                  </button>
                )}
              </div>
              
              <BookList
                books={bookshelf.books || []}
                isOwner={isOwner}
                isEditMode={isEditMode}
                onRemoveBook={handleRemoveBook}
              />
            </div>
      </div>

      {/* Add Book Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">ライブラリから本を選択</h3>
              <button
                onClick={() => setShowAddBookModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {userBooks.map((userBook) => (
                <div
                  key={userBook.id}
                  className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium">{userBook.book.title}</h4>
                      <p className="text-sm text-gray-600">{userBook.book.author}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => addBookToBookshelf(userBook.id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
                  >
                    追加
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Bookshelf Modal */}
      {showEditModal && bookshelf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">本棚を編集</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const description = formData.get('description') as string;
              const isPublic = formData.get('isPublic') === 'on';
              updateBookshelf(name, description, isPublic);
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  本棚名
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={bookshelf.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明
                </label>
                <textarea
                  name="description"
                  defaultValue={bookshelf.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublic"
                    defaultChecked={bookshelf.isPublic}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">公開設定</span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  更新
                </button>
                <button
                  type="button"
                  onClick={enterEditMode}
                  className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  本を編集
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ConfirmDialog
        isOpen={!!removeBookId}
        title="本を本棚から削除"
        message={`「${removeBookTitle}」を本棚から削除しますか？`}
        confirmText="削除"
        onConfirm={removeBookFromBookshelf}
        onCancel={() => {
          setRemoveBookId(null);
          setRemoveBookTitle('');
        }}
        isDangerous
      />
      
      {/* Floating Action Button - Only show when user is owner */}
      {isOwner && (
        <button
          onClick={() => setShowAddBookModal(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 flex items-center justify-center hover:scale-110"
          title="本を追加"
        >
          <span className="text-2xl">📚</span>
        </button>
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