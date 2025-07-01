'use client';

import { useState, useEffect, useCallback } from 'react';
import { bookshelfApi, bookApi, userApi, type Bookshelf, type BookshelfDetailResponse, type UserBook } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { useInitialMinimumLoading } from './useMinimumLoading';
import { useToast } from './useToast';
import { useErrorHandler } from './useErrorHandler';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/messages';
import type { LoadingState } from '@/types/common';

interface BookshelfDetailState extends LoadingState {
  bookshelf: BookshelfDetailResponse | null;
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
  const { showSuccess } = useToast();
  const { handleApiError } = useErrorHandler();
  
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
      
      const bookshelfData = await bookshelfApi.getWithBooks(bookshelfId);
      
      let userBooks: UserBook[] = [];
      let isOwner = false;
      
      // Firebase認証からユーザー情報を取得
      const currentUser = auth.currentUser;
      if (currentUser) {
        // APIから現在のユーザー情報を取得して所有者判定
        try {
          const currentUserData = await userApi.getMe();
          isOwner = currentUserData.id === bookshelfData.user.id;
          
          console.log('🔍 Owner check (API):', {
            currentUserId: currentUserData.id,
            currentUserEmail: currentUserData.email,
            bookshelfUserId: bookshelfData.user.id,
            bookshelfUserEmail: bookshelfData.user.email,
            isOwner: isOwner
          });
          
          // ライブラリデータを取得（所有者の場合のみ）
          if (isOwner) {
            userBooks = await bookApi.getLibrary();
          }
        } catch (error) {
          console.error('Failed to get current user:', error);
          isOwner = false;
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
      handleApiError(error as any, ERROR_MESSAGES.BOOKSHELF_LOAD_FAILED);
      throw error;
    }
  }, [bookshelfId, handleApiError]);

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
      handleApiError(error as any, ERROR_MESSAGES.BOOKSHELF_UPDATE_FAILED);
      throw error;
    }
  }, [bookshelfId, loadBookshelf, showSuccess, handleApiError]);

  /**
   * 本棚に本を追加
   */
  const addBookToBookshelf = useCallback(async (userBookId: number) => {
    try {
      await bookshelfApi.addBook(bookshelfId, userBookId);
      await loadBookshelf();
      showSuccess(SUCCESS_MESSAGES.BOOK_ADDED_TO_BOOKSHELF);
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 500) {
        // Likely a duplicate book error
        handleApiError(error, 'この本は既に本棚に追加されています');
      } else {
        handleApiError(error, ERROR_MESSAGES.BOOK_ADD_TO_BOOKSHELF_FAILED);
      }
      throw error;
    }
  }, [bookshelfId, loadBookshelf, showSuccess, handleApiError]);

  /**
   * 本棚から本を削除
   */
  const removeBookFromBookshelf = useCallback(async (userBookId: number) => {
    try {
      await bookshelfApi.removeBook(bookshelfId, userBookId);
      await loadBookshelf();
      showSuccess(SUCCESS_MESSAGES.BOOK_REMOVED_FROM_BOOKSHELF);
    } catch (error) {
      handleApiError(error as any, ERROR_MESSAGES.BOOK_REMOVE_FROM_BOOKSHELF_FAILED);
      throw error;
    }
  }, [bookshelfId, loadBookshelf, showSuccess, handleApiError]);

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