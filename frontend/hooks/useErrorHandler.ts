'use client';

import { useCallback } from 'react';
import { useToast } from './useToast';
import { ERROR_MESSAGES } from '@/constants/messages';

interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
    status?: number;
  };
  message?: string;
  name?: string;
}

interface UseErrorHandlerReturn {
  handleError: (error: unknown, fallbackMessage?: string) => void;
  handleApiError: (error: ApiError, fallbackMessage?: string) => void;
  handleNetworkError: (error: unknown) => void;
  handleValidationError: (message: string) => void;
}

/**
 * 統一されたエラーハンドリング用カスタムフック
 * 様々なタイプのエラーを適切に処理し、ユーザーに分かりやすいメッセージを表示
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const { showError } = useToast();

  /**
   * 一般的なエラーハンドリング
   */
  const handleError = useCallback((
    error: unknown, 
    fallbackMessage: string = ERROR_MESSAGES.UNKNOWN_ERROR
  ) => {
    console.error('Error occurred:', error);
    
    if (error instanceof Error) {
      // 開発環境では詳細なエラーメッセージを表示
      if (process.env.NODE_ENV === 'development') {
        showError(`${fallbackMessage}: ${error.message}`);
      } else {
        showError(fallbackMessage);
      }
    } else {
      showError(fallbackMessage);
    }
  }, [showError]);

  /**
   * API エラーハンドリング
   */
  const handleApiError = useCallback((
    error: ApiError, 
    fallbackMessage: string = ERROR_MESSAGES.NETWORK_ERROR
  ) => {
    console.error('API Error occurred:', error);
    
    let message = fallbackMessage;
    
    // APIからのエラーメッセージを取得
    if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }
    
    // ステータスコードに基づいた処理
    if (error.response?.status) {
      switch (error.response.status) {
        case 401:
          message = '認証が必要です。再度ログインしてください。';
          // 認証エラーの場合はログイン画面にリダイレクト
          window.location.href = '/login';
          return;
        case 403:
          message = '権限がありません。';
          break;
        case 404:
          message = 'リソースが見つかりません。';
          break;
        case 429:
          message = 'リクエストが多すぎます。しばらく待ってから再試行してください。';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          message = 'サーバーエラーが発生しました。しばらく待ってから再試行してください。';
          break;
      }
    }
    
    showError(message);
  }, [showError]);

  /**
   * ネットワークエラーハンドリング
   */
  const handleNetworkError = useCallback((error: unknown) => {
    console.error('Network Error occurred:', error);
    showError(ERROR_MESSAGES.NETWORK_ERROR);
  }, [showError]);

  /**
   * バリデーションエラーハンドリング
   */
  const handleValidationError = useCallback((message: string) => {
    showError(message);
  }, [showError]);

  return {
    handleError,
    handleApiError,
    handleNetworkError,
    handleValidationError,
  };
}