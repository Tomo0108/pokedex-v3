export const setStorageItem = (key: string, value: string | number | boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, String(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const getStorageItem = (key: string, defaultValue: string): string => {
  if (typeof window === 'undefined') return defaultValue;
  const value = localStorage.getItem(key);
  return value !== null ? value : defaultValue;
};
