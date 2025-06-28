/**
 * 書籍画像表示のためのユーティリティ
 */

export interface BookImageFallbackProps {
  className?: string;
  iconClassName?: string;
}

/**
 * 書籍画像のフォールバック要素のクラス名取得
 */
export function getBookImageFallbackClasses(
  size: 'small' | 'medium' | 'large' = 'medium'
): BookImageFallbackProps {
  const sizeClasses = {
    small: {
      className: 'w-10 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded shadow-sm flex items-center justify-center flex-shrink-0',
      iconClassName: 'text-blue-600 text-lg'
    },
    medium: {
      className: 'w-16 h-24 bg-gradient-to-br from-blue-100 to-purple-200 rounded-lg shadow-sm flex items-center justify-center',
      iconClassName: 'text-blue-600 text-2xl'
    },
    large: {
      className: 'w-24 h-36 bg-gradient-to-br from-blue-100 to-purple-200 rounded-lg shadow-sm flex items-center justify-center',
      iconClassName: 'text-blue-600 text-3xl'
    }
  };

  return sizeClasses[size];
}

/**
 * 書籍画像の標準的な表示クラス名取得
 */
export function getBookImageClasses(size: 'small' | 'medium' | 'large' = 'medium'): string {
  const sizeClasses = {
    small: 'w-10 h-14 object-cover rounded shadow-sm flex-shrink-0',
    medium: 'w-16 h-24 object-cover rounded-lg shadow-sm',
    large: 'w-24 h-36 object-cover rounded-lg shadow-sm'
  };

  return sizeClasses[size];
}