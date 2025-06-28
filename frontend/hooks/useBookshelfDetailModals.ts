'use client';

import { useState, useCallback } from 'react';

interface BookRemovalState {
  removeBookId: number | null;
  removeBookTitle: string;
}

interface ModalState {
  showAddBookModal: boolean;
  showEditModal: boolean;
  bookRemoval: BookRemovalState;
}

interface UseBookshelfDetailModalsReturn extends ModalState {
  // Add Book Modal
  openAddBookModal: () => void;
  closeAddBookModal: () => void;
  
  // Edit Modal
  openEditModal: () => void;
  closeEditModal: () => void;
  
  // Book Removal
  startBookRemoval: (userBookId: number, title: string) => void;
  cancelBookRemoval: () => void;
  confirmBookRemoval: () => Promise<void>;
}

/**
 * 本棚詳細ページのモーダル管理用カスタムフック
 * 本追加・編集・削除確認モーダルの状態管理
 */
export function useBookshelfDetailModals(
  onRemoveBook: (userBookId: number) => Promise<void>
): UseBookshelfDetailModalsReturn {
  const [modalState, setModalState] = useState<ModalState>({
    showAddBookModal: false,
    showEditModal: false,
    bookRemoval: {
      removeBookId: null,
      removeBookTitle: '',
    },
  });

  // === Add Book Modal ===
  
  const openAddBookModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      showAddBookModal: true,
    }));
  }, []);

  const closeAddBookModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      showAddBookModal: false,
    }));
  }, []);

  // === Edit Modal ===
  
  const openEditModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      showEditModal: true,
    }));
  }, []);

  const closeEditModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      showEditModal: false,
    }));
  }, []);

  // === Book Removal ===
  
  const startBookRemoval = useCallback((userBookId: number, title: string) => {
    setModalState(prev => ({
      ...prev,
      bookRemoval: {
        removeBookId: userBookId,
        removeBookTitle: title,
      },
    }));
  }, []);

  const cancelBookRemoval = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      bookRemoval: {
        removeBookId: null,
        removeBookTitle: '',
      },
    }));
  }, []);

  const confirmBookRemoval = useCallback(async () => {
    const { removeBookId } = modalState.bookRemoval;
    if (!removeBookId) return;
    
    try {
      await onRemoveBook(removeBookId);
      cancelBookRemoval();
    } catch (error) {
      // エラーハンドリングは onRemoveBook で行う
      console.error('Book removal failed:', error);
    }
  }, [modalState.bookRemoval, onRemoveBook, cancelBookRemoval]);

  return {
    ...modalState,
    openAddBookModal,
    closeAddBookModal,
    openEditModal,
    closeEditModal,
    startBookRemoval,
    cancelBookRemoval,
    confirmBookRemoval,
  };
}