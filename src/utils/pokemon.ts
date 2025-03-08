import { Pokemon, PokemonType } from '@/types/pokemon';

/**
 * 指定された世代のポケモンデータをJSONファイルから取得する
 * @param generation 取得したい世代番号（1-9）
 * @returns ポケモンデータの配列
 */
export const fetchPokemonData = async (generation: number): Promise<Pokemon[]> => {
  try {
    // 世代番号のバリデーション
    if (generation < 1 || generation > 9) {
      console.error(`Invalid generation number: ${generation}. Must be between 1 and 9.`);
      return [];
    }

    // JSONファイルからデータを取得
    const response = await fetch(`/data/generation-${generation}.json`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data for generation ${generation}: ${response.statusText}`);
    }
    
    const data: Pokemon[] = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching Pokémon data for generation ${generation}:`, error);
    return [];
  }
};

/**
 * 特定のポケモンのデータを取得する
 * @param id ポケモンのID
 * @param generation 世代番号（指定しない場合は全世代から検索）
 * @returns ポケモンデータまたはnull
 */
export const fetchPokemonById = async (id: number, generation?: number): Promise<Pokemon | null> => {
  try {
    // 特定の世代が指定されている場合
    if (generation) {
      const pokemonList = await fetchPokemonData(generation);
      return pokemonList.find(pokemon => pokemon.id === id) || null;
    }
    
    // 世代が指定されていない場合、全世代から検索
    for (let gen = 1; gen <= 9; gen++) {
      const pokemonList = await fetchPokemonData(gen);
      const pokemon = pokemonList.find(pokemon => pokemon.id === id);
      if (pokemon) {
        return pokemon;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching Pokémon with ID ${id}:`, error);
    return null;
  }
};

/**
 * ポケモンの説明文を取得する
 * @param pokemon ポケモンデータ
 * @param version 取得したいバージョン番号（指定しない場合は最新）
 * @returns 説明文オブジェクト
 */
export const getPokemonDescription = (pokemon: Pokemon, version?: number): { en: string; ja: string } => {
  // バージョンが指定されていない場合、利用可能な最新バージョンを使用
  if (!version) {
    const versions = Object.keys(pokemon.descriptions)
      .map(Number)
      .sort((a, b) => b - a);
    
    // 日本語と英語の両方が存在するバージョンを探す
    for (const ver of versions) {
      const desc = pokemon.descriptions[ver];
      if (desc.en && desc.ja) {
        return desc;
      }
    }
    
    // 両方が揃っているバージョンがない場合は、最新のものを返す
    if (versions.length > 0) {
      return pokemon.descriptions[versions[0]];
    }
  } else {
    // 指定されたバージョンの説明文が存在する場合
    if (pokemon.descriptions[version]) {
      return pokemon.descriptions[version];
    }
  }
  
  // 該当する説明文がない場合は空の説明文を返す
  return { en: '', ja: '' };
};
