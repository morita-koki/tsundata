'use client';

import { useState, useCallback } from 'react';
import { bookshelfApi, type Bookshelf } from '@/lib/api';
import { useInitialMinimumLoading } from './useMinimumLoading';
import { useToast } from './useToast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/messages';
import type { LoadingState } from '@/types/common';

interface BookshelfManagementState extends LoadingState {
  bookshelves: Bookshelf[];
  publicBookshelves: Bookshelf[];
}

interface BookshelfForm {
  name: string;
  description: string;
}

interface UseBookshelfManagementReturn extends BookshelfManagementState {
  loadBookshelves: () => Promise<void>;
  refreshBookshelves: () => Promise<void>;
  createBookshelf: (form: BookshelfForm) => Promise<void>;
  updateBookshelf: (id: number, name: string, description: string, isPublic: boolean) => Promise<void>;
  deleteBookshelf: (id: number) => Promise<void>;
  toggleVisibility: (id: number, isCurrentlyPublic: boolean) => Promise<void>;
}

/**
 * 本棚管理用カスタムフック
 * 本棚のCRUD操作、公開設定変更を管理
 */
export function useBookshelfManagement(): UseBookshelfManagementReturn {
  const { showSuccess, showError } = useToast();
  
  const [managementState, setManagementState] = useState<BookshelfManagementState>({
    bookshelves: [],
    publicBookshelves: [],
    isLoading: false,
    error: null,
  });

  /**
   * 本棚データを取得（マイ本棚・公開本棚）
   */
  const loadBookshelves = useCallback(async () => {
    try {
      setManagementState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const [myBookshelves, publicData] = await Promise.all([
        bookshelfApi.getAll(),
        bookshelfApi.getPublic(),
      ]);

      setManagementState(prev => ({
        ...prev,
        bookshelves: myBookshelves,
        publicBookshelves: publicData,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to load bookshelves:', error);
      setManagementState(prev => ({
        ...prev,
        isLoading: false,
        error: ERROR_MESSAGES.BOOKSHELF_LOAD_FAILED,
      }));
      showError(ERROR_MESSAGES.BOOKSHELF_LOAD_FAILED);
      throw error;
    }
  }, [showError]);

  /**
   * 本棚データを再取得（エラーハンドリングなし）
   */
  const refreshBookshelves = useCallback(async () => {
    try {
      const [myBookshelves, publicData] = await Promise.all([
        bookshelfApi.getAll(),
        bookshelfApi.getPublic(),
      ]);

      setManagementState(prev => ({
        ...prev,
        bookshelves: myBookshelves,
        publicBookshelves: publicData,
      }));
    } catch (error) {
      console.error('Failed to refresh bookshelves:', error);
    }
  }, []);

  /**
   * 新しい本棚を作成
   */
  const createBookshelf = useCallback(async (form: BookshelfForm) => {
    if (!form.name.trim()) {
      showError(ERROR_MESSAGES.VALIDATION_REQUIRED);
      return;
    }

    try {
      const newBookshelf = await bookshelfApi.create(form.name, form.description);
      
      setManagementState(prev => ({
        ...prev,
        bookshelves: [...prev.bookshelves, newBookshelf],
      }));
      
      showSuccess(SUCCESS_MESSAGES.BOOKSHELF_CREATED);
    } catch (error) {
      console.error('Failed to create bookshelf:', error);
      showError(ERROR_MESSAGES.BOOKSHELF_CREATE_FAILED);
      throw error;
    }
  }, [showSuccess, showError]);

  /**
   * 本棚を更新
   */
  const updateBookshelf = useCallback(async (
    id: number, 
    name: string, 
    description: string, 
    isPublic: boolean
  ) => {
    try {
      const updatedBookshelf = await bookshelfApi.update(id, name, description, isPublic);
      
      setManagementState(prev => ({
        ...prev,
        bookshelves: prev.bookshelves.map(bs => 
          bs.id === id ? updatedBookshelf : bs
        ),
      }));
      
      // 公開設定が変更された場合は両方のリストを更新
      await refreshBookshelves();
      
      // サイドバーに更新を通知
      window.dispatchEvent(new Event('bookshelfUpdated'));
      
      showSuccess(SUCCESS_MESSAGES.BOOKSHELF_UPDATED);
    } catch (error) {
      console.error('Failed to update bookshelf:', error);
      showError(ERROR_MESSAGES.BOOKSHELF_UPDATE_FAILED);
      throw error;
    }
  }, [showSuccess, showError, refreshBookshelves]);

  /**
   * 本棚を削除
   */
  const deleteBookshelf = useCallback(async (id: number) => {
    try {
      await bookshelfApi.delete(id);
      
      setManagementState(prev => ({
        ...prev,
        bookshelves: prev.bookshelves.filter(bs => bs.id !== id),
      }));
      
      showSuccess(SUCCESS_MESSAGES.BOOKSHELF_DELETED);
    } catch (error) {
      console.error('Failed to delete bookshelf:', error);
      showError(ERROR_MESSAGES.BOOKSHELF_DELETE_FAILED);
      throw error;
    }
  }, [showSuccess, showError]);

  /**
   * 本棚の公開設定を切り替え
   */
  const toggleVisibility = useCallback(async (id: number, isCurrentlyPublic: boolean) => {
    try {
      const updatedBookshelf = await bookshelfApi.updateVisibility(id, !isCurrentlyPublic);
      
      setManagementState(prev => ({
        ...prev,
        bookshelves: prev.bookshelves.map(bs => 
          bs.id === id ? updatedBookshelf : bs
        ),
      }));
      
      // 公開設定変更後は両方のリストを更新
      await refreshBookshelves();
      
      showSuccess(SUCCESS_MESSAGES.BOOKSHELF_VISIBILITY_CHANGED);
    } catch (error) {
      console.error('Failed to toggle bookshelf visibility:', error);
      showError(ERROR_MESSAGES.BOOKSHELF_VISIBILITY_CHANGE_FAILED);
      throw error;
    }
  }, [showSuccess, showError, refreshBookshelves]);

  // 初期データの最小ローディング時間付き読み込み
  const isInitialLoading = useInitialMinimumLoading(loadBookshelves, []);

  return {
    ...managementState,
    isLoading: isInitialLoading || managementState.isLoading,
    loadBookshelves,
    refreshBookshelves,
    createBookshelf,
    updateBookshelf,
    deleteBookshelf,
    toggleVisibility,
  };
}