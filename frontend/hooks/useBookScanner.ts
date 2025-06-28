'use client';

import { useState, useCallback } from 'react';
import { bookApi } from '@/lib/api';
import { useToast } from './useToast';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, WARNING_MESSAGES } from '@/constants/messages';

interface ScannerState {
  isScanning: boolean;
  isProcessing: boolean;
  error: string | null;
}

interface UseBookScannerReturn extends ScannerState {
  openScanner: () => void;
  closeScanner: () => void;
  handleScan: (isbn: string) => Promise<void>;
}

interface UseBookScannerOptions {
  onBookAdded?: () => void;
  onScanComplete?: () => void;
}

/**
 * バーコードスキャナー機能の管理フック
 * ISBN スキャン、本の検索・追加処理を管理
 */
export function useBookScanner(options: UseBookScannerOptions = {}): UseBookScannerReturn {
  const { onBookAdded, onScanComplete } = options;
  const { showSuccess, showError, showWarning } = useToast();
  
  const [scannerState, setScannerState] = useState<ScannerState>({
    isScanning: false,
    isProcessing: false,
    error: null,
  });

  /**
   * スキャナーを開く
   */
  const openScanner = useCallback(() => {
    setScannerState(prev => ({
      ...prev,
      isScanning: true,
      error: null,
    }));
  }, []);

  /**
   * スキャナーを閉じる
   */
  const closeScanner = useCallback(() => {
    setScannerState(prev => ({
      ...prev,
      isScanning: false,
      isProcessing: false,
      error: null,
    }));
    
    if (onScanComplete) {
      onScanComplete();
    }
  }, [onScanComplete]);

  /**
   * ISBN スキャン結果を処理
   */
  const handleScan = useCallback(async (isbn: string) => {
    console.log(`📱 ISBN scanned: ${isbn}`);
    
    // スキャナーを即座に閉じる（非同期処理の前に実行）
    setScannerState(prev => ({
      ...prev,
      isScanning: false,
      isProcessing: true,
      error: null,
    }));
    
    try {
      console.log(`🔍 Searching for book with ISBN: ${isbn}`);
      const book = await bookApi.searchByISBN(isbn);
      console.log(`📖 Book found:`, book);
        
      console.log(`➕ Adding book to library - Book ID: ${book.id}`);
      const userBook = await bookApi.addToLibrary(book.id);
      console.log(`✅ Book added to library:`, userBook);
      
      // 成功メッセージを表示
      showSuccess(`「${book.title}」を${SUCCESS_MESSAGES.BOOK_ADDED}`);
      
      // コールバックを実行（ダッシュボードデータの再読み込みなど）
      if (onBookAdded) {
        onBookAdded();
      }
    } catch (error: any) {
      console.error(`❌ Error in handleScan:`, error);
      console.error(`❌ Error response:`, error.response?.data);
      
      const errorMessage = error.response?.data?.error;
      
      if (errorMessage === 'Book already in your library') {
        // 重複エラーの場合は警告メッセージを表示
        showWarning(WARNING_MESSAGES.BOOK_ALREADY_IN_LIBRARY);
      } else if (errorMessage === 'Book not found in any API') {
        // ISBN検索失敗の場合
        showError(ERROR_MESSAGES.BOOK_NOT_FOUND);
      } else {
        // その他のエラー
        showError(errorMessage || ERROR_MESSAGES.BOOK_ADD_FAILED);
      }
      
      setScannerState(prev => ({
        ...prev,
        error: errorMessage || 'Scan failed',
      }));
      
      throw error; // 必要に応じて呼び出し元でエラーハンドリング
    } finally {
      setScannerState(prev => ({
        ...prev,
        isProcessing: false,
      }));
      
      if (onScanComplete) {
        onScanComplete();
      }
    }
  }, [showSuccess, showError, showWarning, onBookAdded, onScanComplete]);

  return {
    ...scannerState,
    openScanner,
    closeScanner,
    handleScan,
  };
}