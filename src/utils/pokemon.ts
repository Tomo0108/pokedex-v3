import { Pokemon, PokemonType } from '@/types/pokemon';
import generation1Data from '@/data/generation-1.json';

interface RawPokemon {
  id: number;
  name: string;
  japaneseName: string;
  types: string[];
  descriptions: {
    [key: number]: {
      en: string;
      ja: string;
    };
  };
  sprites: {
    front_default: string;
    front_shiny: string;
  };
  form?: string;
}

export const fetchPokemonData = async (generation: number): Promise<Pokemon[]> => {
  // 現在は第1世代のみ対応
  if (generation === 1) {
    return (generation1Data as RawPokemon[]).map(pokemon => {
      // 最新の説明文を取得（キーの最大値を使用）
      const descriptionKeys = Object.keys(pokemon.descriptions).map(Number);
      const latestKey = Math.max(...descriptionKeys);
      const description = pokemon.descriptions[latestKey];

      return {
        id: pokemon.id,
        name: pokemon.name,
        japaneseName: pokemon.japaneseName,
        types: pokemon.types as PokemonType[], // タイプを正しい型にキャスト
        descriptions: pokemon.descriptions,
        description: description,
        sprites: pokemon.sprites,
        form: pokemon.form
      };
    });
  }
  return [];
};
