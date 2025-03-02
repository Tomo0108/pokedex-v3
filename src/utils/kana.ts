// カタカナをひらがなに変換
export const katakanaToHiragana = (str: string): string => {
  return str.replace(/[ァ-ン]/g, match =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  );
};

// ひらがなをカタカナに変換
export const hiraganaToKatakana = (str: string): string => {
  return str.replace(/[ぁ-ん]/g, match =>
    String.fromCharCode(match.charCodeAt(0) + 0x60)
  );
};

// 検索用の文字列を正規化（ひらがな化）
export const normalizeForSearch = (str: string): string => {
  if (!str) return '';
  const normalized = str
    .toLowerCase()
    .normalize('NFKC') // 全角・半角を正規化
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, match => 
      String.fromCharCode(match.charCodeAt(0) - 0xFEE0)
    ) // 全角英数字を半角に変換
    .replace(/[ァ-ンー]/g, match => { // カタカナをひらがなに変換
      if (match === 'ー') return match; // 長音符は変換しない
      return String.fromCharCode(match.charCodeAt(0) - 0x60);
    });
  return normalized;
};

// 3文字以上の部分一致を検出
export const isPartialMatch = (source: string, target: string): boolean => {
  if (!source || !target) return false;
  if (source.length < 3) return false;

  // 数字での検索の場合はそのまま比較
  if (/^\d+$/.test(source)) {
    return target.toString().includes(source);
  }

  const normalizedSource = normalizeForSearch(source);
  const normalizedTarget = normalizeForSearch(target);
  return normalizedTarget.includes(normalizedSource);
};
