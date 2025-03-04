import { Pokemon } from '@/types/pokemon';

/**
 * すべての世代のデータを事前に取得してキャッシュする
 * @param fetchFunction ポケモンデータを取得する関数
 */
export async function prefetchAllGenerations(
  fetchFunction: (generation: number) => Promise<Pokemon[]>
) {
  const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  // 非同期で全世代のデータをプリフェッチ
  generations.forEach(async (gen) => {
    if (gen === 1) return; // 最初の世代は既に読み込み済みなのでスキップ
    
    try {
      await fetchFunction(gen);
      console.log(`Generation ${gen} prefetched`);
    } catch (error) {
      console.error(`Failed to prefetch generation ${gen}:`, error);
    }
  });
}
