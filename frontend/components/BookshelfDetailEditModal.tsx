'use client';

import type { Bookshelf } from '@/lib/api';

interface BookshelfDetailEditModalProps {
  isOpen: boolean;
  bookshelf: Bookshelf | null;
  onClose: () => void;
  onSave: (name: string, description: string, isPublic: boolean) => void;
  onEnterEditMode: () => void;
}

export default function BookshelfDetailEditModal({
  isOpen,
  bookshelf,
  onClose,
  onSave,
  onEnterEditMode,
}: BookshelfDetailEditModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const isPublic = formData.get('isPublic') === 'on';
    onSave(name, description, isPublic);
  };

  if (!isOpen || !bookshelf) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">本棚を編集</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
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
              onClick={onClose}
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
              onClick={onEnterEditMode}
              className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              本を編集
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}