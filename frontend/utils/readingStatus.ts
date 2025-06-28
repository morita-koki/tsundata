/**
 * 読書ステータス表示のためのユーティリティ関数
 */

export interface ReadingStatusInfo {
  icon: string;
  text: string;
  color: string;
  bgColor: string;
}

/**
 * 読書ステータスに基づいて表示情報を取得
 */
export function getReadingStatus(isRead: boolean): ReadingStatusInfo {
  if (isRead) {
    return {
      icon: '✓',
      text: '読了',
      color: 'bg-green-100 text-green-800',
      bgColor: 'bg-green-50'
    };
  }
  return {
    icon: '○',
    text: '未読',
    color: 'bg-gray-100 text-gray-600',
    bgColor: 'bg-gray-50'
  };
}

/**
 * 読書ステータス切り替えボタン用のスタイル取得
 */
export function getReadStatusToggleStyle(isRead: boolean) {
  return isRead
    ? 'bg-green-100 text-green-800 hover:bg-green-200'
    : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-700';
}

/**
 * 読書ステータス切り替えボタンのテキスト取得
 */
export function getReadStatusToggleText(isRead: boolean) {
  return isRead ? '未読に戻す' : '読了にする';
}