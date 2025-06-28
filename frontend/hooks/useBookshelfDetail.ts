'use client';

import { useState, useEffect, useCallback } from 'react';
import { bookshelfApi, bookApi, type Bookshelf, type UserBook } from '@/lib/api';
import { useInitialMinimumLoading } from './useMinimumLoading';
import { useToast } from './useToast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/messages';
import type { LoadingState } from '@/types/common';

interface BookshelfDetailState extends LoadingState {
  bookshelf: Bookshelf | null;
  userBooks: UserBook[];
  isOwner: boolean;
  isEditMode: boolean;
}

interface UseBookshelfDetailReturn extends BookshelfDetailState {
  loadBookshelf: () => Promise<void>;
  updateBookshelf: (name: string, description: string, isPublic: boolean) => Promise<void>;
  addBookToBookshelf: (userBookId: number) => Promise<void>;
  removeBookFromBookshelf: (userBookId: number) => Promise<void>;
  enterEditMode: () => void;
  exitEditMode: () => void;
}

/**
 * 本棚詳細ページ用カスタムフック
 * 本棚データの取得・更新・本の追加削除・編集モード管理
 */
export function useBookshelfDetail(bookshelfId: number): UseBookshelfDetailReturn {
  const { showSuccess, showError } = useToast();
  
  const [detailState, setDetailState] = useState<BookshelfDetailState>({
    bookshelf: null,
    userBooks: [],
    isOwner: false,
    isEditMode: false,
    isLoading: false,
    error: null,
  });

  /**
   * 本棚データを取得
   */
  const loadBookshelf = useCallback(async () => {
    if (!bookshelfId) return;
    
    try {
      setDetailState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const bookshelfData = await bookshelfApi.getById(bookshelfId);
      
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      let userBooks: UserBook[] = [];
      let isOwner = false;
      
      if (token && userData) {
        const user = JSON.parse(userData);
        isOwner = bookshelfData.user?.id === user.id;
        
        // オーナーの場合のみライブラリデータを取得
        if (isOwner) {
          userBooks = await bookApi.getLibrary();
        }
      }
      
      setDetailState(prev => ({
        ...prev,
        bookshelf: bookshelfData,
        userBooks,
        isOwner,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to load bookshelf:', error);
      setDetailState(prev => ({
        ...prev,
        isLoading: false,
        error: ERROR_MESSAGES.BOOKSHELF_LOAD_FAILED,
      }));
      showError(ERROR_MESSAGES.BOOKSHELF_LOAD_FAILED);
      throw error;
    }
  }, [bookshelfId, showError]);

  /**
   * 本棚情報を更新
   */
  const updateBookshelf = useCallback(async (
    name: string, 
    description: string, 
    isPublic: boolean
  ) => {
    try {
      await bookshelfApi.update(bookshelfId, name, description, isPublic);
      await loadBookshelf();
      
      // サイドバーに更新を通知
      window.dispatchEvent(new Event('bookshelfUpdated'));
      
      showSuccess(SUCCESS_MESSAGES.BOOKSHELF_UPDATED);
    } catch (error) {
      console.error('Failed to update bookshelf:', error);
      showError(ERROR_MESSAGES.BOOKSHELF_UPDATE_FAILED);
      throw error;
    }
  }, [bookshelfId, loadBookshelf, showSuccess, showError]);

  /**
   * 本棚に本を追加
   */
  const addBookToBookshelf = useCallback(async (userBookId: number) => {
    try {
      await bookshelfApi.addBook(bookshelfId, userBookId);
      await loadBookshelf();
      showSuccess(SUCCESS_MESSAGES.BOOK_ADDED_TO_BOOKSHELF);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || ERROR_MESSAGES.BOOK_ADD_TO_BOOKSHELF_FAILED;
      showError(errorMessage);
      throw error;
    }
  }, [bookshelfId, loadBookshelf, showSuccess, showError]);

  /**
   * 本棚から本を削除
   */
  const removeBookFromBookshelf = useCallback(async (userBookId: number) => {
    try {
      await bookshelfApi.removeBook(bookshelfId, userBookId);
      await loadBookshelf();
      showSuccess(SUCCESS_MESSAGES.BOOK_REMOVED_FROM_BOOKSHELF);
    } catch (error) {
      console.error('Failed to remove book from bookshelf:', error);
      showError(ERROR_MESSAGES.BOOK_REMOVE_FROM_BOOKSHELF_FAILED);
      throw error;
    }
  }, [bookshelfId, loadBookshelf, showSuccess, showError]);

  /**
   * 編集モードに入る
   */
  const enterEditMode = useCallback(() => {
    setDetailState(prev => ({ ...prev, isEditMode: true }));
  }, []);

  /**
   * 編集モードを終了
   */
  const exitEditMode = useCallback(() => {
    setDetailState(prev => ({ ...prev, isEditMode: false }));
  }, []);

  // 初期データの最小ローディング時間付き読み込み
  const isInitialLoading = useInitialMinimumLoading(loadBookshelf, [bookshelfId]);

  return {
    ...detailState,
    isLoading: isInitialLoading || detailState.isLoading,
    loadBookshelf,
    updateBookshelf,
    addBookToBookshelf,
    removeBookFromBookshelf,
    enterEditMode,
    exitEditMode,
  };
}