export class ISBN {
  constructor(value) {
    if (!value) {
      throw new Error('ISBN cannot be empty');
    }
    
    // ISBNの形式チェック（10桁または13桁の数字、ハイフン含む）
    const cleanedValue = value.replace(/[-\s]/g, '');
    if (!/^\d{10}$|^\d{13}$/.test(cleanedValue)) {
      throw new Error('Invalid ISBN format. Must be 10 or 13 digits');
    }
    
    this.value = cleanedValue;
  }

  toString() {
    return this.value;
  }

  equals(other) {
    return other instanceof ISBN && this.value === other.value;
  }
}