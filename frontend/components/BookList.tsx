'use client';

import { useState, useEffect } from 'react';
import BookCard from './BookCard';

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

interface BookListProps {
  books: BookshelfBook[];
  isOwner: boolean;
  isEditMode?: boolean;
  onRemoveBook: (userBookId: number, title: string) => void;
  onUpdateReadStatus?: (userBookId: number, isRead: boolean) => void;
}

export default function BookList({
  books,
  isOwner,
  isEditMode = false,
  onRemoveBook,
  onUpdateReadStatus
}: BookListProps) {
  if (!books || books.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">本棚が空です</h3>
        <p className="text-gray-500">本を追加して本棚を充実させましょう！</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {books.map((bookshelfBook, index) => (
        <div key={bookshelfBook.userBookId}>
          <BookCard
            bookshelfBook={bookshelfBook}
            index={index}
            isOwner={isOwner}
            isEditMode={isEditMode}
            sortMode={false}
            onRemoveBook={onRemoveBook}
            onUpdateReadStatus={onUpdateReadStatus}
            compact={true}
          />
          {/* Divider - show for all items except the last one */}
          {index < books.length - 1 && (
            <div className="mx-3">
              <div className="border-t border-gray-100"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}