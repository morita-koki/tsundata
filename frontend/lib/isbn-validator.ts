/**
 * ISBN-10とISBN-13のバリデーション機能
 */

export interface ISBNValidationResult {
  isValid: boolean;
  format: 'ISBN-10' | 'ISBN-13' | null;
  cleanISBN: string;
  errorMessage?: string;
}

/**
 * ISBN-10のチェックディジットを計算
 */
function calculateISBN10CheckDigit(isbn9: string): string {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn9[i]) * (10 - i);
  }
  const remainder = sum % 11;
  const checkDigit = 11 - remainder;
  
  if (checkDigit === 10) return 'X';
  if (checkDigit === 11) return '0';
  return checkDigit.toString();
}

/**
 * ISBN-13のチェックディジットを計算
 */
function calculateISBN13CheckDigit(isbn12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(isbn12[i]);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  return checkDigit.toString();
}

/**
 * ISBN-10をISBN-13に変換
 */
export function convertISBN10to13(isbn10: string): string {
  const cleanISBN10 = isbn10.replace(/[-\s]/g, '');
  if (cleanISBN10.length !== 10) return '';
  
  // 978プレフィックスを追加してチェックディジットを除く
  const isbn12 = '978' + cleanISBN10.slice(0, 9);
  const checkDigit = calculateISBN13CheckDigit(isbn12);
  return isbn12 + checkDigit;
}

/**
 * ISBNバリデーション（ISBN-10とISBN-13の両方をサポート）
 */
export function validateISBN(input: string): ISBNValidationResult {
  // 入力値のクリーンアップ（ハイフン、スペース、その他の文字を除去）
  const cleanInput = input.replace(/[-\s]/g, '').toUpperCase();
  
  // 基本的な文字チェック（数字とXのみ許可）
  if (!/^[\dX]+$/.test(cleanInput)) {
    return {
      isValid: false,
      format: null,
      cleanISBN: '',
      errorMessage: 'ISBNは数字とX（ISBN-10の場合）のみ使用できます'
    };
  }

  // 長さによる判定
  if (cleanInput.length === 10) {
    return validateISBN10(cleanInput);
  } else if (cleanInput.length === 13) {
    return validateISBN13(cleanInput);
  } else {
    return {
      isValid: false,
      format: null,
      cleanISBN: '',
      errorMessage: `ISBNは10桁または13桁である必要があります（入力: ${cleanInput.length}桁）`
    };
  }
}

/**
 * ISBN-10バリデーション
 */
function validateISBN10(isbn: string): ISBNValidationResult {
  if (isbn.length !== 10) {
    return {
      isValid: false,
      format: null,
      cleanISBN: '',
      errorMessage: 'ISBN-10は10桁である必要があります'
    };
  }

  // Xは最後の桁のみ許可
  const hasX = isbn.includes('X');
  if (hasX && (isbn.indexOf('X') !== 9 || isbn.lastIndexOf('X') !== 9)) {
    return {
      isValid: false,
      format: null,
      cleanISBN: '',
      errorMessage: 'Xは ISBN-10 の最後の桁のみ使用できます'
    };
  }

  // 最初の9桁は数字のみ
  const first9 = isbn.slice(0, 9);
  if (!/^\d{9}$/.test(first9)) {
    return {
      isValid: false,
      format: null,
      cleanISBN: '',
      errorMessage: 'ISBN-10の最初の9桁は数字である必要があります'
    };
  }

  // チェックディジット検証
  const expectedCheckDigit = calculateISBN10CheckDigit(first9);
  const actualCheckDigit = isbn[9];

  if (expectedCheckDigit !== actualCheckDigit) {
    return {
      isValid: false,
      format: 'ISBN-10',
      cleanISBN: isbn,
      errorMessage: `ISBN-10のチェックディジットが正しくありません（期待値: ${expectedCheckDigit}, 実際: ${actualCheckDigit}）`
    };
  }

  return {
    isValid: true,
    format: 'ISBN-10',
    cleanISBN: isbn
  };
}

/**
 * ISBN-13バリデーション
 */
function validateISBN13(isbn: string): ISBNValidationResult {
  if (isbn.length !== 13) {
    return {
      isValid: false,
      format: null,
      cleanISBN: '',
      errorMessage: 'ISBN-13は13桁である必要があります'
    };
  }

  // 全て数字であることを確認
  if (!/^\d{13}$/.test(isbn)) {
    return {
      isValid: false,
      format: null,
      cleanISBN: '',
      errorMessage: 'ISBN-13は全て数字である必要があります'
    };
  }

  // 978または979で始まることを確認
  if (!isbn.startsWith('978') && !isbn.startsWith('979')) {
    return {
      isValid: false,
      format: 'ISBN-13',
      cleanISBN: isbn,
      errorMessage: 'ISBN-13は978または979で始まる必要があります'
    };
  }

  // チェックディジット検証
  const first12 = isbn.slice(0, 12);
  const expectedCheckDigit = calculateISBN13CheckDigit(first12);
  const actualCheckDigit = isbn[12];

  if (expectedCheckDigit !== actualCheckDigit) {
    return {
      isValid: false,
      format: 'ISBN-13',
      cleanISBN: isbn,
      errorMessage: `ISBN-13のチェックディジットが正しくありません（期待値: ${expectedCheckDigit}, 実際: ${actualCheckDigit}）`
    };
  }

  return {
    isValid: true,
    format: 'ISBN-13',
    cleanISBN: isbn
  };
}

/**
 * ISBNを標準的な表示形式にフォーマット
 */
export function formatISBN(isbn: string, format: 'ISBN-10' | 'ISBN-13'): string {
  const clean = isbn.replace(/[-\s]/g, '');
  
  if (format === 'ISBN-10' && clean.length === 10) {
    // ISBN-10: X-XXXXXXX-XX-X
    return `${clean[0]}-${clean.slice(1, 8)}-${clean.slice(8, 10)}-${clean[10] || ''}`.replace(/-$/, '');
  } else if (format === 'ISBN-13' && clean.length === 13) {
    // ISBN-13: XXX-X-XX-XXXXXX-X
    return `${clean.slice(0, 3)}-${clean[3]}-${clean.slice(4, 6)}-${clean.slice(6, 12)}-${clean[12]}`;
  }
  
  return clean;
}

/**
 * バーコードスキャン結果がISBNかどうかを判定し、バリデーション
 */
export function validateScannedCode(scannedData: string): ISBNValidationResult {
  // バーコードから読み取ったデータをクリーンアップ
  let cleanData = scannedData.trim().replace(/[-\s]/g, '');
  
  // EANコード（ISBN-13）の場合、最初の978または979を確認
  if (cleanData.length === 13 && (cleanData.startsWith('978') || cleanData.startsWith('979'))) {
    return validateISBN13(cleanData);
  }
  
  // ISBN-10の可能性
  if (cleanData.length === 10) {
    return validateISBN10(cleanData);
  }
  
  // その他の長さの場合はISBNとして無効
  return {
    isValid: false,
    format: null,
    cleanISBN: '',
    errorMessage: `スキャンされたコード「${scannedData}」は有効なISBNではありません`
  };
}