/**
 * UI関連の定数
 */

// カラーパレット
export const COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  success: {
    100: '#dcfce7',
    500: '#22c55e',
    800: '#166534',
  },
  warning: {
    100: '#fef3c7',
    500: '#f59e0b',
    800: '#92400e',
  },
  error: {
    100: '#fee2e2',
    500: '#ef4444',
    800: '#991b1b',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const;

// アニメーション設定
export const ANIMATIONS = {
  transition: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// レイアウト設定
export const LAYOUT = {
  sidebar: {
    width: '280px',
    collapsedWidth: '64px',
  },
  header: {
    height: '64px',
  },
  container: {
    maxWidth: '1200px',
    padding: '24px',
  },
} as const;

// ブレークポイント
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// z-index階層
export const Z_INDEX = {
  dropdown: 10,
  sticky: 20,
  modal: 30,
  popover: 40,
  tooltip: 50,
  toast: 60,
} as const;

// Toast設定
export const TOAST_CONFIG = {
  duration: {
    short: 3000,
    normal: 5000,
    long: 8000,
  },
  position: {
    topRight: 'top-right',
    topLeft: 'top-left',
    bottomRight: 'bottom-right',
    bottomLeft: 'bottom-left',
    topCenter: 'top-center',
    bottomCenter: 'bottom-center',
  },
} as const;

// ローディング設定
export const LOADING_CONFIG = {
  minimumDuration: 1000, // 最小ローディング時間（ms）
  debounceDelay: 300, // 検索デバウンス時間（ms）
  enableMinimumLoading: true, // 最小ローディング時間の有効/無効
} as const;

// ページネーション設定
export const PAGINATION_CONFIG = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
  maxVisiblePages: 5,
} as const;

// フォーム設定
export const FORM_CONFIG = {
  validation: {
    debounceDelay: 500,
    minPasswordLength: 8,
    maxUsernameLength: 50,
    maxBookshelfNameLength: 100,
    maxDescriptionLength: 500,
  },
} as const;

// 画像設定
export const IMAGE_CONFIG = {
  bookThumbnail: {
    width: 128,
    height: 192,
    placeholder: '/images/book-placeholder.svg',
  },
  userAvatar: {
    width: 40,
    height: 40,
    placeholder: '/images/user-placeholder.svg',
  },
} as const;

// 検索設定
export const SEARCH_CONFIG = {
  debounceDelay: 300,
  minQueryLength: 2,
  maxRecentSearches: 5,
} as const;

// バーコードスキャナー設定
export const SCANNER_CONFIG = {
  width: 300,
  height: 300,
  fps: 10,
  qrbox: {
    width: 250,
    height: 250,
  },
} as const;

// グリッド設定
export const GRID_CONFIG = {
  bookshelf: {
    columns: {
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
    },
    gap: '24px',
  },
  bookList: {
    columns: {
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
    },
    gap: '16px',
  },
} as const;

// タイムアウト設定
export const TIMEOUT_CONFIG = {
  api: 10000, // API リクエストタイムアウト（ms）
  scanner: 30000, // スキャナータイムアウト（ms）
  toast: 5000, // Toast表示時間（ms）
} as const;