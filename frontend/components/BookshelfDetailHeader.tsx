'use client';

import type { BookshelfDetailResponse } from '@/lib/api';

interface BookshelfDetailHeaderProps {
  bookshelf: BookshelfDetailResponse;
  isOwner: boolean;
  onEdit: () => void;
}

export default function BookshelfDetailHeader({
  bookshelf,
  isOwner,
  onEdit,
}: BookshelfDetailHeaderProps) {
  return (
    <div className="mb-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-2">{bookshelf.name}</h2>
        {bookshelf.description && (
          <p className="text-gray-600 mb-4">{bookshelf.description}</p>
        )}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500">作成者: {bookshelf.user.username}</span>
            <span className={`ml-4 px-2 py-1 rounded text-xs ${
              bookshelf.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {bookshelf.isPublic ? '公開' : '非公開'}
            </span>
          </div>
          
          {isOwner && (
            <button
              onClick={onEdit}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              編集
            </button>
          )}
        </div>
      </div>
    </div>
  );
}