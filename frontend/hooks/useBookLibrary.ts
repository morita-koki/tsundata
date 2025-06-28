'use client';

import { useState, useCallback } from 'react';
import { bookApi, type UserBook } from '@/lib/api';
import { useInitialMinimumLoading } from './useMinimumLoading';
import { 
  filterReadBooks, 
  filterUnreadBooks, 
  transformUserBooksToBookshelfBooks,
  sortByAddedDate 
} from '@/utils/bookDataTransform';
import { ERROR_MESSAGES } from '@/constants/messages';
import { useToast } from './useToast';
import type { LoadingState } from '@/types/common';

interface BookLibraryStats {
  totalBooks: number;
  readBooks: number;
  unreadBooks: number;
}

interface BookLibraryState extends LoadingState {
  allBooks: UserBook[];
  readBooks: UserBook[];
  unreadBooks: UserBook[];
  stats: BookLibraryStats;
}

interface UseBookLibraryReturn extends BookLibraryState {
  loadBooks: () => Promise<void>;
  refreshBooks: () => Promise<void>;
  getTransformedBooks: () => ReturnType<typeof transformUserBooksToBookshelfBooks>;
  getSortedBooks: (ascending?: boolean) => UserBook[];
}

/**
 * 書籍ライブラリ管理用カスタムフック
 * 全書籍データの取得・管理・フィルタリング・統計計算を行う
 */
export function useBookLibrary(): UseBookLibraryReturn {
  const { showError } = useToast();
  
  const [libraryState, setLibraryState] = useState<BookLibraryState>({
    allBooks: [],
    readBooks: [],
    unreadBooks: [],
    stats: {
      totalBooks: 0,
      readBooks: 0,
      unreadBooks: 0,
    },
    isLoading: false,
    error: null,
  });

  /**
   * 統計情報を計算
   */
  const calculateStats = useCallback((books: UserBook[]): BookLibraryStats => {
    const readBooks = filterReadBooks(books);
    const unreadBooks = filterUnreadBooks(books);
    
    return {
      totalBooks: books.length,
      readBooks: readBooks.length,
      unreadBooks: unreadBooks.length,
    };
  }, []);

  /**
   * 書籍データの状態を更新
   */
  const updateLibraryState = useCallback((books: UserBook[]) => {
    const readBooks = filterReadBooks(books);
    const unreadBooks = filterUnreadBooks(books);
    const stats = calculateStats(books);
    
    setLibraryState(prev => ({
      ...prev,
      allBooks: books,
      readBooks,
      unreadBooks,
      stats,
      isLoading: false,
      error: null,
    }));
  }, [calculateStats]);

  /**
   * 書籍データを取得
   */
  const loadBooks = useCallback(async () => {
    try {
      console.log('📖 Loading all books...');
      setLibraryState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const libraryData = await bookApi.getLibrary();
      console.log('📚 Library data:', libraryData);
      
      updateLibraryState(libraryData);
    } catch (error) {
      console.error('❌ Failed to load books:', error);
      setLibraryState(prev => ({
        ...prev,
        isLoading: false,
        error: ERROR_MESSAGES.BOOKS_LOAD_FAILED,
      }));
      showError(ERROR_MESSAGES.BOOKS_LOAD_FAILED);
      throw error;
    }
  }, [updateLibraryState, showError]);

  /**
   * 書籍データを再取得（エラーハンドリングなし）
   */
  const refreshBooks = useCallback(async () => {
    try {
      const libraryData = await bookApi.getLibrary();
      updateLibraryState(libraryData);
    } catch (error) {
      console.error('Failed to refresh books:', error);
    }
  }, [updateLibraryState]);

  /**
   * BookListコンポーネント用の形式に変換
   */
  const getTransformedBooks = useCallback(() => {
    return transformUserBooksToBookshelfBooks(libraryState.allBooks);
  }, [libraryState.allBooks]);

  /**
   * 追加日時でソートされた書籍リストを取得
   */
  const getSortedBooks = useCallback((ascending: boolean = false) => {
    return sortByAddedDate(libraryState.allBooks, ascending);
  }, [libraryState.allBooks]);

  // 初期データの最小ローディング時間付き読み込み
  const isInitialLoading = useInitialMinimumLoading(loadBooks, []);

  return {
    ...libraryState,
    isLoading: isInitialLoading || libraryState.isLoading,
    loadBooks,
    refreshBooks,
    getTransformedBooks,
    getSortedBooks,
  };
}