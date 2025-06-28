'use client';

import { useState, useCallback } from 'react';
import { bookApi, userApi, bookshelfApi, type UserBook, type Stats, type Bookshelf } from '@/lib/api';
import { useInitialMinimumLoading } from './useMinimumLoading';
import { filterUnreadBooks, transformUserBooksToBookshelfBooks } from '@/utils/bookDataTransform';
import type { LoadingState } from '@/types/common';

interface DashboardData {
  stats: Stats | null;
  bookshelves: Bookshelf[];
  allBooks: UserBook[];
  unreadBooks: UserBook[];
}

interface DashboardState extends LoadingState, DashboardData {}

interface UseDashboardReturn extends DashboardState {
  loadData: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshBookshelves: () => Promise<void>;
  refreshBooks: () => Promise<void>;
  getTransformedUnreadBooks: () => ReturnType<typeof transformUserBooksToBookshelfBooks>;
}

/**
 * ダッシュボード用の状態管理フック
 * 統計データ、本棚データ、書籍データの取得・管理を行う
 */
export function useDashboard(): UseDashboardReturn {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    stats: null,
    bookshelves: [],
    allBooks: [],
    unreadBooks: [],
    isLoading: false,
    error: null,
  });

  /**
   * すべてのダッシュボードデータを並行取得
   */
  const loadData = useCallback(async () => {
    console.log('📊 Loading dashboard data...');
    
    try {
      setDashboardState(prev => ({ ...prev, isLoading: true, error: null }));

      const [statsData, bookshelvesData, libraryData] = await Promise.all([
        userApi.getStats(),
        bookshelfApi.getAll(),
        bookApi.getLibrary()
      ]);
      
      console.log('📈 Stats data:', statsData);
      console.log('📚 Bookshelves data:', bookshelvesData);
      console.log('📖 Library data:', libraryData);
      
      const unreadBooks = filterUnreadBooks(libraryData);
      
      setDashboardState({
        stats: statsData,
        bookshelves: bookshelvesData,
        allBooks: libraryData,
        unreadBooks,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      setDashboardState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load dashboard data',
      }));
      throw error;
    }
  }, []);

  /**
   * 統計データのみを再取得
   */
  const refreshStats = useCallback(async () => {
    try {
      const statsData = await userApi.getStats();
      setDashboardState(prev => ({
        ...prev,
        stats: statsData,
      }));
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  }, []);

  /**
   * 本棚データのみを再取得
   */
  const refreshBookshelves = useCallback(async () => {
    try {
      const bookshelvesData = await bookshelfApi.getAll();
      setDashboardState(prev => ({
        ...prev,
        bookshelves: bookshelvesData,
      }));
    } catch (error) {
      console.error('Failed to refresh bookshelves:', error);
    }
  }, []);

  /**
   * 書籍データのみを再取得
   */
  const refreshBooks = useCallback(async () => {
    try {
      const libraryData = await bookApi.getLibrary();
      const unreadBooks = filterUnreadBooks(libraryData);
      
      setDashboardState(prev => ({
        ...prev,
        allBooks: libraryData,
        unreadBooks,
      }));
    } catch (error) {
      console.error('Failed to refresh books:', error);
    }
  }, []);

  /**
   * 未読本データをBookListコンポーネント用に変換
   */
  const getTransformedUnreadBooks = useCallback(() => {
    return transformUserBooksToBookshelfBooks(dashboardState.unreadBooks);
  }, [dashboardState.unreadBooks]);

  // 初期データの最小ローディング時間付き読み込み
  const isInitialLoading = useInitialMinimumLoading(loadData, []);

  return {
    ...dashboardState,
    isLoading: isInitialLoading || dashboardState.isLoading,
    loadData,
    refreshStats,
    refreshBookshelves,
    refreshBooks,
    getTransformedUnreadBooks,
  };
}