/**
 * 共通型定義
 */

// ローディング状態の管理
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// API レスポンスの基本型
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

// フォーム関連の型
export interface FormField {
  value: string;
  error?: string;
  touched?: boolean;
}

export interface FormState {
  [key: string]: FormField;
}

// ページネーション
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ソート設定
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// フィルター設定
export interface FilterConfig {
  [key: string]: any;
}

// モーダル関連
export interface ModalState {
  isOpen: boolean;
  data?: any;
}

// Toast関連（useToast.tsから移動予定）
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// 権限関連
export interface Permission {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

// 検索関連
export interface SearchState {
  query: string;
  results: any[];
  isSearching: boolean;
}

// 一般的なID型
export type ID = string | number;

// 日付文字列型
export type DateString = string;

// カラー設定
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

// サイズ設定
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';