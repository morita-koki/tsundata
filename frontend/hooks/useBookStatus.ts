'use client';

import { useCallback } from 'react';
import { bookApi } from '@/lib/api';
import { useToast } from './useToast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/messages';

interface UseBookStatusReturn {
  updateReadStatus: (userBookId: number, isRead: boolean) => Promise<void>;
  removeFromLibrary: (userBookId: number) => Promise<void>;
}

interface UseBookStatusOptions {
  onStatusUpdate?: () => void;
  onBookRemove?: () => void;
}

/**
 * 本の読了状態管理用カスタムフック
 * 複数のページで共通して使用される読了状態の更新・削除機能を提供
 */
export function useBookStatus(options: UseBookStatusOptions = {}): UseBookStatusReturn {
  const { onStatusUpdate, onBookRemove } = options;
  const { showSuccess, showError } = useToast();

  /**
   * 読了状態を更新
   */
  const updateReadStatus = useCallback(async (userBookId: number, isRead: boolean) => {
    try {
      await bookApi.updateReadStatus(userBookId, isRead);
      
      // 成功メッセージを表示
      const message = isRead 
        ? SUCCESS_MESSAGES.BOOK_READ_STATUS_UPDATED_READ
        : SUCCESS_MESSAGES.BOOK_READ_STATUS_UPDATED_UNREAD;
      showSuccess(message);
      
      // コールバックを実行（データの再読み込みなど）
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error: any) {
      console.error('Failed to update read status:', error);
      showError(ERROR_MESSAGES.BOOK_READ_STATUS_UPDATE_FAILED);
      throw error; // 呼び出し元でエラーハンドリングが必要な場合
    }
  }, [showSuccess, showError, onStatusUpdate]);

  /**
   * ライブラリから本を削除
   */
  const removeFromLibrary = useCallback(async (userBookId: number) => {
    try {
      await bookApi.removeFromLibrary(userBookId);
      
      showSuccess(SUCCESS_MESSAGES.BOOK_REMOVED_FROM_LIBRARY);
      
      // コールバックを実行（データの再読み込みなど）
      if (onBookRemove) {
        onBookRemove();
      }
    } catch (error: any) {
      console.error('Failed to remove book from library:', error);
      showError(ERROR_MESSAGES.BOOK_REMOVE_FAILED);
      throw error;
    }
  }, [showSuccess, showError, onBookRemove]);

  return {
    updateReadStatus,
    removeFromLibrary,
  };
}