'use client';

import type { Bookshelf } from '@/lib/api';

interface BookshelfGridProps {
  bookshelves: Bookshelf[];
  isOwner?: boolean;
  onEdit?: (bookshelf: Bookshelf) => void;
  onDelete?: (bookshelf: Bookshelf) => void;
  onToggleVisibility?: (id: number, isCurrentlyPublic: boolean) => void;
}

export default function BookshelfGrid({
  bookshelves,
  isOwner = false,
  onEdit,
  onDelete,
  onToggleVisibility,
}: BookshelfGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bookshelves.map((bookshelf) => (
        <div
          key={bookshelf.id}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="font-bold text-lg mb-2">{bookshelf.name}</h3>
          {bookshelf.description && (
            <p className="text-gray-600 mb-4">{bookshelf.description}</p>
          )}

          {isOwner ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <a
                  href={`/bookshelves/${bookshelf.id}`}
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  本棚を見る
                </a>

                <button
                  onClick={() =>
                    onToggleVisibility?.(bookshelf.id, bookshelf.isPublic)
                  }
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    bookshelf.isPublic
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {bookshelf.isPublic ? "公開中" : "非公開"}
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit?.(bookshelf)}
                  className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  編集
                </button>
                <button
                  onClick={() => onDelete?.(bookshelf)}
                  className="flex-1 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                >
                  削除
                </button>
              </div>
            </div>
          ) : (
            <div>
              {bookshelf.user && (
                <p className="text-sm text-gray-500 mb-4">
                  作成者: {bookshelf.user.username}
                </p>
              )}
              <a
                href={`/bookshelves/${bookshelf.id}`}
                className="text-indigo-600 hover:text-indigo-500"
              >
                本棚を見る
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}