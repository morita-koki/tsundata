'use client';

import { useState } from 'react';

interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  description: string;
  pageCount: number;
  thumbnail: string;
  price: number;
}

interface UserBook {
  id: number;
  isRead: boolean;
  addedAt: string;
  readAt: string | null;
  book: Book;
}

interface SimpleBookCardProps {
  userBook: UserBook;
  onToggleRead: (id: number, isRead: boolean) => void;
  onRemove: (userBook: UserBook) => void;
}

export default function SimpleBookCard({ userBook, onToggleRead, onRemove }: SimpleBookCardProps) {
  const [imageError, setImageError] = useState(false);

  const getReadingStatus = () => {
    if (userBook.isRead) {
      return {
        icon: '✓',
        text: '読了',
        color: 'bg-green-100 text-green-800',
        bgColor: 'bg-green-50'
      };
    }
    return {
      icon: '○',
      text: '未読',
      color: 'bg-gray-100 text-gray-600',
      bgColor: 'bg-gray-50'
    };
  };

  const status = getReadingStatus();

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex space-x-4">
        {/* Book Cover */}
        <div className="flex-shrink-0">
          {!imageError && userBook.book.thumbnail ? (
            <img
              src={userBook.book.thumbnail}
              alt={userBook.book.title}
              className="w-16 h-24 object-cover rounded-lg shadow-sm"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-16 h-24 bg-gradient-to-br from-blue-100 to-purple-200 rounded-lg shadow-sm flex items-center justify-center">
              <span className="text-blue-600 text-2xl">📚</span>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-lg leading-tight mb-2 text-gray-900">
            {userBook.book.title}
          </h4>
          <p className="text-gray-600 text-sm mb-3">{userBook.book.author}</p>

          {/* Status */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${status.color}`}>
            <span className="mr-1">{status.icon}</span>
            {status.text}
          </div>

          {/* Price */}
          {userBook.book.price && (
            <div className="mb-3">
              <span className="font-semibold text-lg text-gray-900">
                ¥{userBook.book.price.toLocaleString()}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => onToggleRead(userBook.id, userBook.isRead)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                userBook.isRead
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {userBook.isRead ? '未読に戻す' : '読了にする'}
            </button>
            <button
              onClick={() => onRemove(userBook)}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}