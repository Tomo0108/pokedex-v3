export type StorageValue = string | number | boolean;

export const storage = {
  setItem(key: string, value: StorageValue): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, String(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  getRawItem(key: string, defaultValue: StorageValue): string {
    if (typeof window === 'undefined') return String(defaultValue);
    try {
      const value = localStorage.getItem(key);
      return value !== null ? value : String(defaultValue);
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return String(defaultValue);
    }
  },

  getString(key: string, defaultValue: string): string {
    const value = this.getRawItem(key, defaultValue);
    return String(value);
  },

  getNumber(key: string, defaultValue: number): number {
    const stringValue = this.getRawItem(key, defaultValue);
    const value = parseInt(stringValue, 10);
    return isNaN(value) ? defaultValue : value;
  },

  getBoolean(key: string, defaultValue: boolean): boolean {
    const stringValue = this.getRawItem(key, defaultValue);
    if (stringValue === 'true') return true;
    if (stringValue === 'false') return false;
    return defaultValue;
  }
} as const;
