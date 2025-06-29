/**
 * ISBN Service
 * 高度なISBN検証、分析、変換機能を提供
 * ISO 2108:2017 国際規格準拠
 */

import { BaseService } from './BaseService.js';
import type { RepositoryContainer } from '../repositories/index.js';
import { InvalidIsbnError } from '../errors/index.js';

// ISBN構造の詳細情報
export interface ISBNInfo {
  original: string;           // 元の入力値
  cleaned: string;           // クリーンアップ後
  format: 'ISBN-10' | 'ISBN-13';
  isValid: boolean;
  
  // ISBN-13の場合の詳細情報
  ean: string | null;        // EANプレフィックス (978 or 979)
  groupIdentifier: string | null;  // 国・言語グループ
  publisherCode: string | null;    // 出版社コード  
  itemNumber: string | null;       // 商品番号
  checkDigit: string;             // チェックディジット
  
  // 地域・言語情報
  region: string | null;          // 地域名（日本、米国など）
  language: string | null;        // 主要言語
  
  // 変換結果
  isbn10: string | null;          // ISBN-10形式
  isbn13: string | null;          // ISBN-13形式
  
  // バーコード情報
  ean13: string | null;           // EAN-13バーコード形式
  
  // エラー情報
  errors: ISBNValidationError[];
}

export interface ISBNValidationError {
  code: string;
  message: string;
  field?: string;
  expected?: string;
  actual?: string;
}

// 国・言語グループの定義
interface GroupInfo {
  range: string;
  region: string;
  language: string[];
}

export class ISBNService extends BaseService {
  // ISBN グループ識別子のマッピング（主要な部分のみ）
  private readonly groupIdentifiers: Record<string, GroupInfo> = {
    '0': { range: '0', region: '英語圏', language: ['英語'] },
    '1': { range: '1', region: '英語圏', language: ['英語'] },
    '2': { range: '2', region: 'フランス語圏', language: ['フランス語'] },
    '3': { range: '3', region: 'ドイツ語圏', language: ['ドイツ語'] },
    '4': { range: '4', region: '日本', language: ['日本語'] },
    '5': { range: '5', region: 'ロシア語圏', language: ['ロシア語'] },
    '7': { range: '7', region: '中国', language: ['中国語'] },
    '88': { range: '88', region: 'イタリア', language: ['イタリア語'] },
    '89': { range: '89', region: '韓国', language: ['韓国語'] },
    '957': { range: '957', region: '台湾', language: ['中国語（繁体字）'] },
    '978': { range: '978', region: '国際', language: ['多言語'] },
    '979': { range: '979', region: '国際（新規）', language: ['多言語'] },
  };

  constructor(repositories: RepositoryContainer) {
    super(repositories);
  }

  /**
   * 包括的なISBN分析と検証
   */
  public analyzeISBN(input: string): ISBNInfo {
    console.log(`📖 ISBN分析開始: "${input}"`);
    
    const info: ISBNInfo = {
      original: input,
      cleaned: '',
      format: 'ISBN-13',
      isValid: false,
      ean: null,
      groupIdentifier: null,
      publisherCode: null,
      itemNumber: null,
      checkDigit: '',
      region: null,
      language: null,
      isbn10: null,
      isbn13: null,
      ean13: null,
      errors: []
    };

    try {
      // 1. 入力のクリーンアップ
      info.cleaned = this.cleanISBN(input);
      
      // 2. 基本形式の検証
      this.validateBasicFormat(info);
      
      if (info.errors.length === 0) {
        // 3. フォーマット判定
        info.format = info.cleaned.length === 10 ? 'ISBN-10' : 'ISBN-13';
        
        // 4. 詳細分析
        this.analyzeStructure(info);
        
        // 5. チェックディジット検証
        this.validateCheckDigit(info);
        
        // 6. 地域・言語情報の特定
        this.identifyRegionAndLanguage(info);
        
        // 7. 相互変換
        this.performConversions(info);
        
        // 8. バーコード生成
        this.generateBarcodeInfo(info);
        
        info.isValid = info.errors.length === 0;
      }

      const status = info.isValid ? '✅' : '❌';
      console.log(`${status} ISBN分析完了: ${info.format}, 地域: ${info.region || 'Unknown'}`);
      
      return info;
    } catch (error) {
      console.error('❌ ISBN分析エラー:', error);
      info.errors.push({
        code: 'ANALYSIS_ERROR',
        message: `分析中にエラーが発生しました: ${(error as Error).message}`
      });
      return info;
    }
  }

  /**
   * 簡易バリデーション（既存インターフェース互換）
   */
  public validateISBN(isbn: string): void {
    const info = this.analyzeISBN(isbn);
    if (!info.isValid) {
      const primaryError = info.errors[0];
      throw new InvalidIsbnError(`${isbn}: ${primaryError?.message || 'Invalid ISBN format'}`);
    }
  }

  /**
   * ISBN-10からISBN-13への変換
   */
  public convertToISBN13(isbn10: string): string {
    const info = this.analyzeISBN(isbn10);
    if (info.format !== 'ISBN-10' || !info.isValid) {
      throw new InvalidIsbnError(`Invalid ISBN-10: ${isbn10}`);
    }
    return info.isbn13!;
  }

  /**
   * ISBN-13からISBN-10への変換（978プレフィックスのみ）
   */
  public convertToISBN10(isbn13: string): string {
    const info = this.analyzeISBN(isbn13);
    if (info.format !== 'ISBN-13' || !info.isValid) {
      throw new InvalidIsbnError(`Invalid ISBN-13: ${isbn13}`);
    }
    if (!info.isbn10) {
      throw new InvalidIsbnError(`ISBN-13 ${isbn13} cannot be converted to ISBN-10 (not 978 prefix)`);
    }
    return info.isbn10;
  }

  /**
   * EAN-13バーコードからISBN抽出
   */
  public extractISBNFromBarcode(barcode: string): ISBNInfo | null {
    const cleaned = barcode.replace(/[-\s]/g, '');
    
    // EAN-13は13桁
    if (cleaned.length !== 13 || !/^\d{13}$/.test(cleaned)) {
      return null;
    }
    
    // 978または979で始まる場合のみISBN
    if (!cleaned.startsWith('978') && !cleaned.startsWith('979')) {
      return null;
    }
    
    console.log(`📱 バーコードからISBN抽出: ${barcode} -> ${cleaned}`);
    return this.analyzeISBN(cleaned);
  }

  /**
   * 地域フィルタリング用のISBN生成（日本の書籍のみなど）
   */
  public isJapaneseISBN(isbn: string): boolean {
    const info = this.analyzeISBN(isbn);
    return info.isValid && info.region === '日本';
  }

  /**
   * バッチ処理用の高速バリデーション
   */
  public validateISBNBatch(isbns: string[]): { valid: string[]; invalid: string[] } {
    console.log(`📚 バッチISBN検証開始: ${isbns.length}件`);
    
    const result = { valid: [] as string[], invalid: [] as string[] };
    
    for (const isbn of isbns) {
      try {
        this.validateISBN(isbn);
        result.valid.push(isbn);
      } catch {
        result.invalid.push(isbn);
      }
    }
    
    console.log(`✅ バッチ検証完了: 有効 ${result.valid.length}件, 無効 ${result.invalid.length}件`);
    return result;
  }

  // === プライベートメソッド ===

  /**
   * ISBN文字列のクリーンアップ
   */
  private cleanISBN(input: string): string {
    return input
      .trim()
      .replace(/[-\s]/g, '')  // ハイフンとスペースを除去
      .replace(/^ISBN[-:\s]*/i, '')  // ISBN プレフィックスを除去
      .toUpperCase();  // 'x' -> 'X'
  }

  /**
   * 基本フォーマットの検証
   */
  private validateBasicFormat(info: ISBNInfo): void {
    const { cleaned } = info;
    
    // 長さチェック
    if (cleaned.length !== 10 && cleaned.length !== 13) {
      info.errors.push({
        code: 'INVALID_LENGTH',
        message: `ISBNは10桁または13桁である必要があります`,
        expected: '10 or 13 digits',
        actual: `${cleaned.length} digits`
      });
      return;
    }
    
    // 文字チェック
    if (cleaned.length === 10) {
      if (!/^\d{9}[\dX]$/.test(cleaned)) {
        info.errors.push({
          code: 'INVALID_CHARACTERS_ISBN10',
          message: 'ISBN-10は9桁の数字＋チェックディジット（数字またはX）の形式である必要があります',
          expected: '9 digits + check digit (0-9 or X)',
          actual: cleaned
        });
      }
    } else {
      if (!/^\d{13}$/.test(cleaned)) {
        info.errors.push({
          code: 'INVALID_CHARACTERS_ISBN13',
          message: 'ISBN-13は13桁の数字である必要があります',
          expected: '13 digits',
          actual: cleaned
        });
      }
    }
  }

  /**
   * ISBN構造の詳細分析
   */
  private analyzeStructure(info: ISBNInfo): void {
    const { cleaned, format } = info;
    
    if (format === 'ISBN-13') {
      // EANプレフィックス
      info.ean = cleaned.substring(0, 3);
      
      // ISBN-13の場合、978または979である必要がある
      if (info.ean !== '978' && info.ean !== '979') {
        info.errors.push({
          code: 'INVALID_EAN_PREFIX',
          message: 'ISBN-13のEANプレフィックスは978または979である必要があります',
          expected: '978 or 979',
          actual: info.ean
        });
        return;
      }
      
      // グループ識別子の特定（1-5桁の可変長）
      const withoutEan = cleaned.substring(3, 12); // チェックディジットを除く
      info.groupIdentifier = this.extractGroupIdentifier(withoutEan);
      info.checkDigit = cleaned.substring(12);
      
      // 残りの部分から出版社コードと商品番号を分析
      if (info.groupIdentifier) {
        const remaining = withoutEan.substring(info.groupIdentifier.length);
        const splitPoint = this.estimatePublisherCodeLength(info.groupIdentifier, remaining);
        if (splitPoint > 0 && splitPoint < remaining.length) {
          info.publisherCode = remaining.substring(0, splitPoint);
          info.itemNumber = remaining.substring(splitPoint);
        }
      }
    } else {
      // ISBN-10の場合
      info.groupIdentifier = this.extractGroupIdentifier(cleaned.substring(0, 9));
      info.checkDigit = cleaned.substring(9);
      
      if (info.groupIdentifier) {
        const remaining = cleaned.substring(info.groupIdentifier.length, 9);
        const splitPoint = this.estimatePublisherCodeLength(info.groupIdentifier, remaining);
        if (splitPoint > 0 && splitPoint < remaining.length) {
          info.publisherCode = remaining.substring(0, splitPoint);
          info.itemNumber = remaining.substring(splitPoint);
        }
      }
    }
  }

  /**
   * グループ識別子の抽出（可変長対応）
   */
  private extractGroupIdentifier(segment: string): string | null {
    // 1桁から5桁まで順次チェック
    for (let len = 1; len <= Math.min(5, segment.length); len++) {
      const candidate = segment.substring(0, len);
      if (this.groupIdentifiers[candidate]) {
        return candidate;
      }
    }
    
    // 特殊ケース: 複数桁のグループ（例：957）
    const multiDigitGroups = ['88', '89', '957', '978', '979'];
    for (const group of multiDigitGroups) {
      if (segment.startsWith(group)) {
        return group;
      }
    }
    
    return null;
  }

  /**
   * 出版社コード長の推定（簡易版）
   */
  private estimatePublisherCodeLength(groupId: string, remaining: string): number {
    // 日本（グループ4）の場合の特別処理
    if (groupId === '4') {
      // 日本の出版社コードは通常2-7桁
      if (remaining.length >= 6) return 3; // 大手出版社
      if (remaining.length >= 4) return 2; // 中堅出版社
      return 1; // 小規模出版社
    }
    
    // その他の地域では一般的な分割
    if (remaining.length >= 6) return 3;
    if (remaining.length >= 4) return 2;
    return 1;
  }

  /**
   * チェックディジットの検証
   */
  private validateCheckDigit(info: ISBNInfo): void {
    if (info.format === 'ISBN-10') {
      if (!this.validateISBN10Checksum(info.cleaned)) {
        info.errors.push({
          code: 'INVALID_CHECKSUM_ISBN10',
          message: 'ISBN-10のチェックサムが正しくありません',
          field: 'checkDigit'
        });
      }
    } else {
      if (!this.validateISBN13Checksum(info.cleaned)) {
        info.errors.push({
          code: 'INVALID_CHECKSUM_ISBN13',
          message: 'ISBN-13のチェックサムが正しくありません',
          field: 'checkDigit'
        });
      }
    }
  }

  /**
   * 地域・言語情報の特定
   */
  private identifyRegionAndLanguage(info: ISBNInfo): void {
    if (info.groupIdentifier && this.groupIdentifiers[info.groupIdentifier]) {
      const groupInfo = this.groupIdentifiers[info.groupIdentifier];
      if (groupInfo) {
        info.region = groupInfo.region;
        info.language = groupInfo.language.join(', ');
      }
    }
  }

  /**
   * ISBN-10/13相互変換
   */
  private performConversions(info: ISBNInfo): void {
    if (info.format === 'ISBN-10' && info.isValid) {
      // ISBN-10 -> ISBN-13 (978プレフィックス追加)
      const withoutCheckDigit = info.cleaned.substring(0, 9);
      const isbn13Base = '978' + withoutCheckDigit;
      const checkDigit = this.calculateISBN13CheckDigit(isbn13Base);
      info.isbn13 = isbn13Base + checkDigit;
      info.isbn10 = info.cleaned;
    } else if (info.format === 'ISBN-13' && info.isValid && info.ean === '978') {
      // ISBN-13 -> ISBN-10 (978プレフィックス除去、978のみ)
      const withoutEanAndCheck = info.cleaned.substring(3, 12);
      const checkDigit = this.calculateISBN10CheckDigit(withoutEanAndCheck);
      info.isbn10 = withoutEanAndCheck + checkDigit;
      info.isbn13 = info.cleaned;
    } else if (info.format === 'ISBN-13' && info.isValid) {
      // 979プレフィックスの場合はISBN-10に変換不可
      info.isbn13 = info.cleaned;
      info.isbn10 = null;
    }
  }

  /**
   * バーコード情報の生成
   */
  private generateBarcodeInfo(info: ISBNInfo): void {
    if (info.isbn13) {
      info.ean13 = info.isbn13;
    }
  }

  /**
   * ISBN-10チェックサム計算
   */
  private calculateISBN10CheckDigit(isbn9: string): string {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      const char = isbn9[i];
      if (char) {
        sum += parseInt(char, 10) * (10 - i);
      }
    }
    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : 11 - remainder;
    return checkDigit === 10 ? 'X' : checkDigit.toString();
  }

  /**
   * ISBN-13チェックサム計算
   */
  private calculateISBN13CheckDigit(isbn12: string): string {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const char = isbn12[i];
      if (char) {
        const digit = parseInt(char, 10);
        sum += i % 2 === 0 ? digit : digit * 3;
      }
    }
    const remainder = sum % 10;
    return remainder === 0 ? '0' : (10 - remainder).toString();
  }

  /**
   * ISBN-10チェックサム検証
   */
  private validateISBN10Checksum(isbn: string): boolean {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      const char = isbn[i];
      if (!char || !/\d/.test(char)) return false;
      sum += parseInt(char, 10) * (10 - i);
    }
    const lastChar = isbn[9];
    if (!lastChar) return false;
    const checkDigit = lastChar === 'X' ? 10 : parseInt(lastChar, 10);
    if (isNaN(checkDigit)) return false;
    return (sum + checkDigit) % 11 === 0;
  }

  /**
   * ISBN-13チェックサム検証
   */
  private validateISBN13Checksum(isbn: string): boolean {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const char = isbn[i];
      if (!char || !/\d/.test(char)) return false;
      const digit = parseInt(char, 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const lastChar = isbn[12];
    if (!lastChar || !/\d/.test(lastChar)) return false;
    const checkDigit = parseInt(lastChar, 10);
    return (sum + checkDigit) % 10 === 0;
  }

  /**
   * デバッグ用: 詳細情報の表示
   */
  public debugISBN(isbn: string): void {
    const info = this.analyzeISBN(isbn);
    
    console.log('\n📖 ===== ISBN詳細分析 =====');
    console.log(`元の入力: ${info.original}`);
    console.log(`クリーン後: ${info.cleaned}`);
    console.log(`フォーマット: ${info.format}`);
    console.log(`有効性: ${info.isValid ? '✅ 有効' : '❌ 無効'}`);
    
    if (info.ean) console.log(`EANプレフィックス: ${info.ean}`);
    if (info.groupIdentifier) console.log(`グループ識別子: ${info.groupIdentifier}`);
    if (info.publisherCode) console.log(`出版社コード: ${info.publisherCode}`);
    if (info.itemNumber) console.log(`商品番号: ${info.itemNumber}`);
    console.log(`チェックディジット: ${info.checkDigit}`);
    
    if (info.region) console.log(`地域: ${info.region}`);
    if (info.language) console.log(`言語: ${info.language}`);
    
    if (info.isbn10) console.log(`ISBN-10: ${info.isbn10}`);
    if (info.isbn13) console.log(`ISBN-13: ${info.isbn13}`);
    if (info.ean13) console.log(`EAN-13: ${info.ean13}`);
    
    if (info.errors.length > 0) {
      console.log('\n❌ エラー:');
      info.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. [${error.code}] ${error.message}`);
      });
    }
    console.log('========================\n');
  }
}