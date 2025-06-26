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

interface BookshelfBook {
  userBookId: number;
  addedAt: string;
  displayOrder: number;
  isRead: boolean;
  readAt: string | null;
  book: Book;
}

interface BookCardProps {
  bookshelfBook: BookshelfBook;
  index: number;
  isOwner: boolean;
  isEditMode?: boolean;
  sortMode: boolean;
  onRemoveBook: (userBookId: number, title: string) => void;
  onUpdateReadStatus?: (userBookId: number, isRead: boolean) => void;
  compact?: boolean;
}

export default function BookCard({
  bookshelfBook,
  index,
  isOwner,
  isEditMode = false,
  sortMode,
  onRemoveBook,
  onUpdateReadStatus,
  compact = false
}: BookCardProps) {
  const [imageError, setImageError] = useState(false);

  const getReadingStatus = () => {
    if (bookshelfBook.isRead) {
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
    <div className="p-3 hover:bg-gray-50 transition-colors duration-150">
      <div className="flex items-center space-x-3">
        {!imageError && bookshelfBook.book.thumbnail ? (
          <img
            src={bookshelfBook.book.thumbnail}
            alt={bookshelfBook.book.title}
            className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-10 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded shadow-sm flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 text-lg">📖</span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-tight mb-1 text-gray-900 truncate">
            {bookshelfBook.book.title}
          </h4>
          <p className="text-gray-600 text-xs mb-1.5 truncate">{bookshelfBook.book.author}</p>
          
          <div className="flex items-center space-x-2">
            {onUpdateReadStatus ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateReadStatus(bookshelfBook.userBookId, !bookshelfBook.isRead);
                }}
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  bookshelfBook.isRead 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700'
                }`}
              >
                <span className="mr-0.5">{status.icon}</span>
                {status.text}
              </button>
            ) : (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                <span className="mr-0.5">{status.icon}</span>
                {status.text}
              </span>
            )}
            {bookshelfBook.book.price && (
              <span className="text-xs font-medium text-gray-900">
                ¥{bookshelfBook.book.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        
        {isOwner && isEditMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveBook(bookshelfBook.userBookId, bookshelfBook.book.title);
            }}
            className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors flex-shrink-0"
          >
            削除
          </button>
        )}
      </div>
    </div>
  );

}