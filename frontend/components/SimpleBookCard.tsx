'use client';

import { useState } from 'react';
import type { UserBook } from '@/types/api';
import { getReadingStatus, getReadStatusToggleText } from '@/utils/readingStatus';
import { getBookImageClasses, getBookImageFallbackClasses } from '@/utils/imageError';

interface SimpleBookCardProps {
  userBook: UserBook;
  onToggleRead: (id: number, isRead: boolean) => void;
  onRemove: (userBook: UserBook) => void;
}

export default function SimpleBookCard({ userBook, onToggleRead, onRemove }: SimpleBookCardProps) {
  const [imageError, setImageError] = useState(false);

  const status = getReadingStatus(userBook.isRead);
  const imageClasses = getBookImageClasses('medium');
  const fallbackClasses = getBookImageFallbackClasses('medium');

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex space-x-4">
        {/* Book Cover */}
        <div className="flex-shrink-0">
          {!imageError && userBook.book.thumbnail ? (
            <img
              src={userBook.book.thumbnail}
              alt={userBook.book.title}
              className={imageClasses}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={fallbackClasses.className}>
              <span className={fallbackClasses.iconClassName}>📚</span>
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
              {getReadStatusToggleText(userBook.isRead)}
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