'use client';

import BookList from './BookList';
import type { BookshelfDetailResponse } from '@/lib/api';

interface BookshelfDetailContentProps {
  bookshelf: BookshelfDetailResponse;
  isOwner: boolean;
  isEditMode: boolean;
  onRemoveBook: (userBookId: number, title: string) => void;
  onExitEditMode: () => void;
}

export default function BookshelfDetailContent({
  bookshelf,
  isOwner,
  isEditMode,
  onRemoveBook,
  onExitEditMode,
}: BookshelfDetailContentProps) {
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">本棚の本 ({bookshelf.books?.length || 0}冊)</h3>
        {isEditMode && (
          <button
            onClick={onExitEditMode}
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
        onRemoveBook={onRemoveBook}
      />
    </div>
  );
}