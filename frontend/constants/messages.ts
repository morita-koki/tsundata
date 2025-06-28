/**
 * アプリケーション内で使用するメッセージ定数
 */

// 成功メッセージ
export const SUCCESS_MESSAGES = {
  BOOK_ADDED: '本をライブラリに追加しました！',
  BOOK_READ_STATUS_UPDATED_READ: '本を読了に変更しました！',
  BOOK_READ_STATUS_UPDATED_UNREAD: '本を未読に変更しました',
  BOOK_REMOVED_FROM_LIBRARY: '本をライブラリから削除しました',
  BOOK_ADDED_TO_BOOKSHELF: '本を本棚に追加しました',
  BOOK_REMOVED_FROM_BOOKSHELF: '本を本棚から削除しました',
  BOOKSHELF_CREATED: '本棚を作成しました',
  BOOKSHELF_UPDATED: '本棚を更新しました',
  BOOKSHELF_DELETED: '本棚を削除しました',
  BOOKSHELF_VISIBILITY_CHANGED: '本棚の公開設定を変更しました',
  USER_PROFILE_UPDATED: 'プロフィールを更新しました',
  LOGIN_SUCCESS: 'ログインしました',
  LOGOUT_SUCCESS: 'ログアウトしました',
  REGISTRATION_SUCCESS: 'アカウントを作成しました',
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  BOOK_NOT_FOUND: 'この ISBN の本が見つかりませんでした。手動で追加するか、別のバーコードをお試しください。',
  BOOK_ALREADY_EXISTS: 'この本は既にライブラリに登録されています。',
  BOOK_ADD_FAILED: '本の追加に失敗しました',
  BOOK_READ_STATUS_UPDATE_FAILED: '読書状況の変更に失敗しました',
  BOOK_REMOVE_FAILED: '本の削除に失敗しました',
  BOOKSHELF_CREATE_FAILED: '本棚の作成に失敗しました',
  BOOKSHELF_UPDATE_FAILED: '本棚の更新に失敗しました',
  BOOKSHELF_DELETE_FAILED: '本棚の削除に失敗しました',
  BOOKSHELF_VISIBILITY_CHANGE_FAILED: '本棚の公開設定の変更に失敗しました',
  BOOKSHELF_LOAD_FAILED: '本棚の読み込みに失敗しました',
  BOOKS_LOAD_FAILED: '本の読み込みに失敗しました',
  BOOK_ADD_TO_BOOKSHELF_FAILED: '本の追加に失敗しました',
  BOOK_REMOVE_FROM_BOOKSHELF_FAILED: '本の削除に失敗しました',
  LOGIN_FAILED: 'ログインに失敗しました',
  LOGOUT_FAILED: 'ログアウトに失敗しました',
  REGISTRATION_FAILED: 'アカウント作成に失敗しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
  VALIDATION_REQUIRED: 'この項目は必須です',
  VALIDATION_EMAIL_INVALID: '有効なメールアドレスを入力してください',
  VALIDATION_PASSWORD_TOO_SHORT: 'パスワードは8文字以上で入力してください',
  PERMISSION_DENIED: '権限がありません',
} as const;

// 警告メッセージ
export const WARNING_MESSAGES = {
  BOOK_ALREADY_IN_LIBRARY: 'この本は既にライブラリに登録されています。',
  BOOK_ALREADY_IN_BOOKSHELF: 'この本は既に本棚に追加されています。',
  UNSAVED_CHANGES: '保存されていない変更があります。ページを離れますか？',
  DELETE_CONFIRMATION: '削除しますか？この操作は取り消せません。',
  BOOKSHELF_DELETE_CONFIRMATION: '本棚を削除しますか？この操作は取り消せません。',
  CAMERA_PERMISSION_REQUIRED: 'カメラの使用許可が必要です',
  NETWORK_SLOW: 'ネットワークが遅いようです。しばらくお待ちください。',
} as const;

// 情報メッセージ
export const INFO_MESSAGES = {
  LOADING_DASHBOARD: 'ダッシュボードを読み込み中...',
  LOADING_BOOKS: '書籍一覧を読み込み中...',
  LOADING_BOOKSHELVES: '本棚を読み込み中...',
  LOADING_BOOKSHELF_DETAIL: '本棚の詳細を読み込み中...',
  SCANNING_BARCODE: 'バーコードをスキャンしています...',
  SEARCHING_BOOK: '本を検索しています...',
  NO_BOOKS_FOUND: '本が見つかりませんでした',
  NO_BOOKSHELVES_FOUND: '本棚が見つかりませんでした',
  NO_UNREAD_BOOKS: 'すべての本を読み終えました！素晴らしいです！',
  EMPTY_LIBRARY: '本を追加して読書を始めましょう！',
  FIRST_BOOKSHELF: '最初の本棚を作成しましょう！',
} as const;

// 確認ダイアログのメッセージ
export const DIALOG_MESSAGES = {
  DELETE_BOOK: {
    title: '本を削除',
    message: '本をライブラリから削除しますか？',
    confirmText: '削除',
    cancelText: 'キャンセル',
  },
  DELETE_BOOKSHELF: {
    title: '本棚を削除',
    message: (name: string) => `「${name}」を削除しますか？この操作は取り消せません。`,
    confirmText: '削除',
    cancelText: 'キャンセル',
  },
  REMOVE_BOOK_FROM_BOOKSHELF: {
    title: '本を本棚から削除',
    message: (title: string) => `「${title}」を本棚から削除しますか？`,
    confirmText: '削除',
    cancelText: 'キャンセル',
  },
  LOGOUT: {
    title: 'ログアウト',
    message: 'ログアウトしますか？',
    confirmText: 'ログアウト',
    cancelText: 'キャンセル',
  },
} as const;

// フォームラベル
export const FORM_LABELS = {
  EMAIL: 'メールアドレス',
  PASSWORD: 'パスワード',
  USERNAME: 'ユーザー名',
  BOOKSHELF_NAME: '本棚名',
  BOOKSHELF_DESCRIPTION: '説明（オプション）',
  IS_PUBLIC: '公開設定',
  SEARCH: '検索',
  FILTER: 'フィルター',
  SORT: '並び順',
} as const;

// ボタンテキスト
export const BUTTON_TEXTS = {
  LOGIN: 'ログイン',
  LOGOUT: 'ログアウト',
  REGISTER: 'アカウント作成',
  SAVE: '保存',
  CANCEL: 'キャンセル',
  DELETE: '削除',
  EDIT: '編集',
  ADD: '追加',
  REMOVE: '削除',
  CREATE: '作成',
  UPDATE: '更新',
  CLOSE: '閉じる',
  BACK: '戻る',
  NEXT: '次へ',
  PREVIOUS: '前へ',
  SUBMIT: '送信',
  RESET: 'リセット',
  CONFIRM: '確認',
  VIEW_ALL: 'すべて見る',
  ADD_BOOK: '本を追加',
  SCAN_BARCODE: 'バーコードスキャン',
  CREATE_BOOKSHELF: '新しい本棚を作成',
  EDIT_BOOKSHELF: '本棚を編集',
  ADD_TO_BOOKSHELF: '本棚に追加',
} as const;