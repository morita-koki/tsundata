'use client';

import type { UserBook } from '@/lib/api';

interface BookshelfAddBookModalProps {
  isOpen: boolean;
  userBooks: UserBook[];
  onClose: () => void;
  onAddBook: (userBookId: number) => void;
}

export default function BookshelfAddBookModal({
  isOpen,
  userBooks,
  onClose,
  onAddBook,
}: BookshelfAddBookModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">ライブラリから本を選択</h3>
          <button
            onClick={onClose}
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
                onClick={() => onAddBook(userBook.id)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
              >
                追加
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}