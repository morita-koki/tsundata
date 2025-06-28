'use client';

interface BookshelfCreateFormProps {
  isVisible: boolean;
  formData: {
    name: string;
    description: string;
  };
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onUpdateField: (field: 'name' | 'description', value: string) => void;
}

export default function BookshelfCreateForm({
  isVisible,
  formData,
  onSubmit,
  onCancel,
  onUpdateField,
}: BookshelfCreateFormProps) {
  if (!isVisible) return null;

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white p-4 rounded-lg shadow mb-4"
    >
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          本棚名
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onUpdateField('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          説明（オプション）
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onUpdateField('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={3}
        />
      </div>
      <div className="flex space-x-2">
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          作成
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}