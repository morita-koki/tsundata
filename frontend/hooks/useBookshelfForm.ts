'use client';

import { useState, useCallback } from 'react';
import type { Bookshelf } from '@/lib/api';

interface BookshelfFormData {
  name: string;
  description: string;
}

interface BookshelfFormState {
  showCreateForm: boolean;
  createForm: BookshelfFormData;
  editingBookshelf: Bookshelf | null;
  deleteBookshelf: Bookshelf | null;
}

interface UseBookshelfFormReturn extends BookshelfFormState {
  // Create form actions
  openCreateForm: () => void;
  closeCreateForm: () => void;
  updateCreateForm: (field: keyof BookshelfFormData, value: string) => void;
  resetCreateForm: () => void;
  
  // Edit actions
  startEditing: (bookshelf: Bookshelf) => void;
  cancelEditing: () => void;
  
  // Delete actions
  startDeleting: (bookshelf: Bookshelf) => void;
  cancelDeleting: () => void;
  
  // Form submission
  getCreateFormData: () => BookshelfFormData;
}

const initialCreateForm: BookshelfFormData = {
  name: '',
  description: '',
};

/**
 * 本棚フォーム管理用カスタムフック
 * 作成・編集・削除のフォーム状態とモーダル管理
 */
export function useBookshelfForm(): UseBookshelfFormReturn {
  const [formState, setFormState] = useState<BookshelfFormState>({
    showCreateForm: false,
    createForm: { ...initialCreateForm },
    editingBookshelf: null,
    deleteBookshelf: null,
  });

  // === Create Form Actions ===
  
  const openCreateForm = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      showCreateForm: true,
      createForm: { ...initialCreateForm },
    }));
  }, []);

  const closeCreateForm = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      showCreateForm: false,
    }));
  }, []);

  const updateCreateForm = useCallback((field: keyof BookshelfFormData, value: string) => {
    setFormState(prev => ({
      ...prev,
      createForm: {
        ...prev.createForm,
        [field]: value,
      },
    }));
  }, []);

  const resetCreateForm = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      createForm: { ...initialCreateForm },
      showCreateForm: false,
    }));
  }, []);

  // === Edit Actions ===
  
  const startEditing = useCallback((bookshelf: Bookshelf) => {
    setFormState(prev => ({
      ...prev,
      editingBookshelf: bookshelf,
    }));
  }, []);

  const cancelEditing = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      editingBookshelf: null,
    }));
  }, []);

  // === Delete Actions ===
  
  const startDeleting = useCallback((bookshelf: Bookshelf) => {
    setFormState(prev => ({
      ...prev,
      deleteBookshelf: bookshelf,
    }));
  }, []);

  const cancelDeleting = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      deleteBookshelf: null,
    }));
  }, []);

  // === Form Data ===
  
  const getCreateFormData = useCallback((): BookshelfFormData => {
    return { ...formState.createForm };
  }, [formState.createForm]);

  return {
    ...formState,
    openCreateForm,
    closeCreateForm,
    updateCreateForm,
    resetCreateForm,
    startEditing,
    cancelEditing,
    startDeleting,
    cancelDeleting,
    getCreateFormData,
  };
}