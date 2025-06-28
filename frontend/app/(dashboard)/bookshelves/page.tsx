"use client";

import BookshelfEditModal from "@/components/BookshelfEditModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import Navigation from "@/components/Navigation";
import Toast from "@/components/Toast";
import LoadingPage from "@/components/LoadingPage";
import BookshelfGrid from "@/components/BookshelfGrid";
import BookshelfCreateForm from "@/components/BookshelfCreateForm";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { useBookshelfManagement } from "@/hooks/useBookshelfManagement";
import { useBookshelfForm } from "@/hooks/useBookshelfForm";

export default function BookshelvesPage() {
  const { toasts, removeToast } = useToast();
  
  // 認証管理
  const { isAuthenticated } = useAuth();
  
  // 本棚管理
  const {
    bookshelves,
    publicBookshelves,
    isLoading,
    createBookshelf,
    updateBookshelf,
    deleteBookshelf,
    toggleVisibility,
  } = useBookshelfManagement();
  
  // フォーム管理
  const {
    showCreateForm,
    createForm,
    editingBookshelf,
    deleteBookshelf: deleteBookshelfState,
    openCreateForm,
    closeCreateForm,
    updateCreateForm,
    resetCreateForm,
    startEditing,
    cancelEditing,
    startDeleting,
    cancelDeleting,
    getCreateFormData,
  } = useBookshelfForm();


  // フォーム送信ハンドラー
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = getCreateFormData();
    await createBookshelf(formData);
    resetCreateForm();
  };

  const handleEdit = async (name: string, description: string, isPublic: boolean) => {
    if (!editingBookshelf) return;
    await updateBookshelf(editingBookshelf.id, name, description, isPublic);
    cancelEditing();
  };

  const handleDelete = async () => {
    if (!deleteBookshelfState) return;
    await deleteBookshelf(deleteBookshelfState.id);
    cancelDeleting();
  };

  if (isLoading) {
    return <LoadingPage text="本棚を読み込み中..." />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation title="本棚一覧" />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* My Bookshelves */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">マイ本棚</h2>
            <button
              onClick={openCreateForm}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
              新しい本棚を作成
            </button>
          </div>

          <BookshelfCreateForm
            isVisible={showCreateForm}
            formData={createForm}
            onSubmit={handleCreateSubmit}
            onCancel={closeCreateForm}
            onUpdateField={updateCreateForm}
          />

          <BookshelfGrid
            bookshelves={bookshelves}
            isOwner={true}
            onEdit={startEditing}
            onDelete={startDeleting}
            onToggleVisibility={toggleVisibility}
          />
        </div>

        {/* Public Bookshelves */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">公開本棚</h2>
          <BookshelfGrid bookshelves={publicBookshelves} />
        </div>
      </div>

      <BookshelfEditModal
        bookshelf={editingBookshelf}
        isOpen={!!editingBookshelf}
        onClose={cancelEditing}
        onSave={handleEdit}
      />

      <ConfirmDialog
        isOpen={!!deleteBookshelfState}
        title="本棚を削除"
        message={`「${deleteBookshelfState?.name}」を削除しますか？この操作は取り消せません。`}
        confirmText="削除"
        onConfirm={handleDelete}
        onCancel={cancelDeleting}
        isDangerous
      />

      {/* Toast notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
