/**
 * 本棚関連の型定義
 */

import type { Book } from './api';

// 本棚の表示モード
export type BookshelfViewMode = 'grid' | 'list';

// 本棚の編集モード
export type BookshelfEditMode = 'view' | 'edit' | 'reorder';

// 本棚フォームの状態
export interface BookshelfFormData {
  name: string;
  description: string;
  isPublic: boolean;
}

// 本棚の統計情報
export interface BookshelfStats {
  totalBooks: number;
  readBooks: number;
  unreadBooks: number;
  totalValue: number;
  unreadValue: number;
  readPercentage: number;
}

// 本棚内の本の表示情報
export interface BookshelfBookDisplay {
  userBookId: number;
  book: Book;
  isRead: boolean;
  addedAt: string;
  readAt: string | null;
  displayOrder: number;
  isSelected?: boolean; // 編集モード用
}

// 本棚の権限情報
export interface BookshelfPermission {
  isOwner: boolean;
  canView: boolean;
  canEdit: boolean;
  canAddBooks: boolean;
  canRemoveBooks: boolean;
  canChangeVisibility: boolean;
}

// 本棚のフィルター設定
export interface BookshelfFilter {
  readStatus?: 'all' | 'read' | 'unread';
  sortBy?: 'addedAt' | 'title' | 'author' | 'displayOrder';
  sortDirection?: 'asc' | 'desc';
}

// 本追加モーダルの状態
export interface AddBookModalState {
  isOpen: boolean;
  availableBooks: any[]; // UserBook[]
  searchQuery: string;
  filteredBooks: any[];
}

// 本棚編集モーダルの状態
export interface BookshelfEditModalState {
  isOpen: boolean;
  formData: BookshelfFormData;
  isSubmitting: boolean;
  errors: Partial<Record<keyof BookshelfFormData, string>>;
}

// ドラッグ&ドロップ関連
export interface DragDropResult {
  sourceIndex: number;
  destinationIndex: number;
  bookId: number;
}

// 本棚カード表示用
export interface BookshelfCardData {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  bookCount: number;
  thumbnails: string[]; // 最初の数冊のサムネイル
  owner?: {
    id: number;
    username: string;
  };
  stats?: BookshelfStats;
}