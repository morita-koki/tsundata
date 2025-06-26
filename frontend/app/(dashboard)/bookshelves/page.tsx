"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { bookshelfApi, Bookshelf } from "@/lib/api";
import BookshelfEditModal from "@/components/BookshelfEditModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import Navigation from "@/components/Navigation";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

export default function BookshelvesPage() {
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [publicBookshelves, setPublicBookshelves] = useState<Bookshelf[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBookshelfName, setNewBookshelfName] = useState("");
  const [newBookshelfDescription, setNewBookshelfDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingBookshelf, setEditingBookshelf] = useState<Bookshelf | null>(
    null
  );
  const [deleteBookshelf, setDeleteBookshelf] = useState<Bookshelf | null>(
    null
  );
  const router = useRouter();
  const { toasts, removeToast, showSuccess, showError } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get fresh token and store it
          const token = await firebaseUser.getIdToken();
          localStorage.setItem("token", token);
          loadBookshelves();
        } catch (error) {
          console.error("Auth state change error:", error);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadBookshelves = async () => {
    try {
      const [myBookshelves, publicData] = await Promise.all([
        bookshelfApi.getAll(),
        bookshelfApi.getPublic(),
      ]);

      setBookshelves(myBookshelves);
      setPublicBookshelves(publicData);
    } catch (error) {
      console.error("Failed to load bookshelves:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBookshelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookshelfName.trim()) return;

    try {
      const newBookshelf = await bookshelfApi.create(
        newBookshelfName,
        newBookshelfDescription
      );
      setBookshelves((prev) => [...prev, newBookshelf]);
      setNewBookshelfName("");
      setNewBookshelfDescription("");
      setShowCreateForm(false);
    } catch (error) {
      alert("本棚の作成に失敗しました");
    }
  };

  const toggleVisibility = async (
    bookshelfId: number,
    isCurrentlyPublic: boolean
  ) => {
    try {
      const updatedBookshelf = await bookshelfApi.updateVisibility(
        bookshelfId,
        !isCurrentlyPublic
      );
      setBookshelves((prev) =>
        prev.map((bs) => (bs.id === bookshelfId ? updatedBookshelf : bs))
      );
      loadBookshelves(); // Refresh both lists
      showSuccess("本棚の公開設定を変更しました");
    } catch (error) {
      showError("本棚の公開設定の変更に失敗しました");
    }
  };

  const handleEditBookshelf = async (name: string, description: string, isPublic: boolean) => {
    if (!editingBookshelf) return;
    
    try {
      const updatedBookshelf = await bookshelfApi.update(editingBookshelf.id, name, description, isPublic);
      setBookshelves((prev) =>
        prev.map((bs) =>
          bs.id === editingBookshelf.id ? updatedBookshelf : bs
        )
      );
      setEditingBookshelf(null);
      loadBookshelves(); // Refresh both lists
      // Notify sidebar of the update
      window.dispatchEvent(new Event('bookshelfUpdated'));
      showSuccess("本棚を更新しました");
    } catch (error) {
      showError("本棚の更新に失敗しました");
    }
  };

  const handleDeleteBookshelf = async () => {
    if (!deleteBookshelf) return;

    try {
      await bookshelfApi.delete(deleteBookshelf.id);
      setBookshelves((prev) =>
        prev.filter((bs) => bs.id !== deleteBookshelf.id)
      );
      setDeleteBookshelf(null);
      showSuccess("本棚を削除しました");
    } catch (error) {
      showError("本棚の削除に失敗しました");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="本棚一覧" />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* My Bookshelves */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">マイ本棚</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
              新しい本棚を作成
            </button>
          </div>

          {showCreateForm && (
            <form
              onSubmit={createBookshelf}
              className="bg-white p-4 rounded-lg shadow mb-4"
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  本棚名
                </label>
                <input
                  type="text"
                  value={newBookshelfName}
                  onChange={(e) => setNewBookshelfName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明（オプション）
                </label>
                <textarea
                  value={newBookshelfDescription}
                  onChange={(e) => setNewBookshelfDescription(e.target.value)}
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
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
                >
                  キャンセル
                </button>
              </div>
            </form>
          )}

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
                        toggleVisibility(bookshelf.id, bookshelf.isPublic)
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
                      onClick={() => setEditingBookshelf(bookshelf)}
                      className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => setDeleteBookshelf(bookshelf)}
                      className="flex-1 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Public Bookshelves */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">公開本棚</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicBookshelves.map((bookshelf) => (
              <div
                key={bookshelf.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <h3 className="font-bold text-lg mb-2">{bookshelf.name}</h3>
                {bookshelf.description && (
                  <p className="text-gray-600 mb-2">{bookshelf.description}</p>
                )}
                <p className="text-sm text-gray-500 mb-4">
                  作成者: {bookshelf.user?.username}
                </p>

                <a
                  href={`/bookshelves/${bookshelf.id}`}
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  本棚を見る
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BookshelfEditModal
        bookshelf={editingBookshelf}
        isOpen={!!editingBookshelf}
        onClose={() => setEditingBookshelf(null)}
        onSave={handleEditBookshelf}
      />

      <ConfirmDialog
        isOpen={!!deleteBookshelf}
        title="本棚を削除"
        message={`「${deleteBookshelf?.name}」を削除しますか？この操作は取り消せません。`}
        confirmText="削除"
        onConfirm={handleDeleteBookshelf}
        onCancel={() => setDeleteBookshelf(null)}
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
