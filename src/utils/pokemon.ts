import { SpriteStyles, Pokemon } from '@/types/pokemon';

// ローカルの画像パス
const LOCAL_SPRITES_BASE_URL = '/images/pokemon_sprites';
// 画像が存在しない場合のフォールバック用のグレー画像URL
const FALLBACK_IMAGE_URL = '/images/no-sprite.png';

export const spriteStyles: SpriteStyles = {
  'red-blue': { 
    path: '/versions/generation-i/red-blue/transparent',
    gens: [1],
    animated: false,
    displayName: { ja: '赤・青', en: 'Red-Blue' }
  },
  'yellow': {
    path: '/versions/generation-i/yellow/transparent',
    gens: [1],
    animated: false,
    displayName: { ja: 'ピカチュウ', en: 'Yellow' }
  },
  'gold': {
    path: '/versions/generation-ii/gold/transparent',
    gens: [1, 2],
    animated: false,
    displayName: { ja: '金', en: 'Gold' }
  },
  'silver': {
    path: '/versions/generation-ii/silver/transparent',
    gens: [1, 2],
    animated: false,
    displayName: { ja: '銀', en: 'Silver' }
  },
  'crystal': { 
    path: '/versions/generation-ii/crystal/transparent',
    gens: [1, 2],
    animated: false,
    displayName: { ja: 'クリスタル', en: 'Crystal' }
  },
  'ruby-sapphire': {
    path: '/versions/generation-iii/ruby-sapphire',
    gens: [1, 2, 3],
    animated: false,
    displayName: { ja: 'ルビー・サファイア', en: 'Ruby-Sapphire' }
  },
  'emerald': { 
    path: '/versions/generation-iii/emerald',
    gens: [1, 2, 3],
    animated: false,
    displayName: { ja: 'エメラルド', en: 'Emerald' }
  },
  'firered-leafgreen': {
    path: '/versions/generation-iii/firered-leafgreen',
    gens: [1, 2, 3],
    animated: false,
    displayName: { ja: 'FR・LG', en: 'FR-LG' }
  },
  'diamond-pearl': { 
    path: '/versions/generation-iv/diamond-pearl',
    gens: [1, 2, 3, 4],
    animated: false,
    displayName: { ja: 'ダイヤモンド・パール', en: 'Diamond-Pearl' }
  },
  'platinum': {
    path: '/versions/generation-iv/platinum',
    gens: [1, 2, 3, 4],
    animated: false,
    displayName: { ja: 'プラチナ', en: 'Platinum' }
  },
  'heartgold-soulsilver': {
    path: '/versions/generation-iv/heartgold-soulsilver',
    gens: [1, 2, 3, 4],
    animated: false,
    displayName: { ja: 'HG・SS', en: 'HG-SS' }
  },
  'black-white': {
    path: '/versions/generation-v/black-white/animated/',
    gens: [1, 2, 3, 4, 5],
    animated: true,
    displayName: { ja: 'ブラック・ホワイト', en: 'Black-White' }
  }
};

export function getDefaultStyleForGeneration(generation: number): keyof typeof spriteStyles {
  if (generation === 1) return 'red-blue';
  if (generation === 2) return 'crystal';
  if (generation === 3) return 'emerald';
  if (generation === 4) return 'diamond-pearl';
  if (generation === 5) return 'black-white';
  return 'black-white';
}

async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function createSpriteUrl(pokemonId: number, style: keyof typeof spriteStyles, shiny: boolean = false): Promise<string> {
  const styleInfo = spriteStyles[style];
  const shinyPath = shiny ? '/shiny' : '';
  
  // ローカルの画像パスを使用
  const spriteUrl = `${LOCAL_SPRITES_BASE_URL}${styleInfo.path}${shinyPath}/${pokemonId}.png`;
  
  // 画像の存在チェックは省略（ローカルファイルなので常に存在すると仮定）
  return spriteUrl;
}

async function getLatestDescription(entries: any[], language: string, generation: number) {
  // 9世代のバージョンID
  const gen9VersionIds = [33, 34]; // scarlet: 33, violet: 34

  const filterAndSortEntries = (entries: any[], lang: string) => 
    entries
      .filter(entry => entry.language.name === lang && entry.version)
      .sort((a, b) => {
        const versionA = parseInt(a.version.url.split('/')[6]);
        const versionB = parseInt(b.version.url.split('/')[6]);
        return versionB - versionA;
      });

  const validEntries = filterAndSortEntries(entries, language);
  const englishEntries = filterAndSortEntries(entries, 'en');

  // 9世代の場合は特別な処理
  if (generation === 9) {
    const gen9Entry = validEntries.find(entry => {
      const versionId = parseInt(entry.version.url.split('/')[6]);
      return gen9VersionIds.includes(versionId);
    });

    // 日本語の説明がない場合は英語の説明を使用
    if (language === 'ja' && !gen9Entry) {
      const englishGen9Entry = englishEntries.find(entry => {
        const versionId = parseInt(entry.version.url.split('/')[6]);
        return gen9VersionIds.includes(versionId);
      });
      if (englishGen9Entry) {
        return englishGen9Entry.flavor_text.replace(/[\n\f]/g, ' ');
      }
    }

    if (gen9Entry) {
      return gen9Entry.flavor_text.replace(/[\n\f]/g, ' ');
    }
  }

  return validEntries[0]?.flavor_text.replace(/[\n\f]/g, ' ') || englishEntries[0]?.flavor_text.replace(/[\n\f]/g, ' ') || '';
}

export async function fetchPokemonData(generation: number) {
  const ranges = {
    1: [1, 151],
    2: [152, 251],
    3: [252, 386],
    4: [387, 493],
    5: [494, 649],
    6: [650, 721],
    7: [722, 809],
    8: [810, 905],
    9: [906, 1025],
  };

  try {
    // ローカルのJSONファイルからデータを読み込む
    const response = await fetch(`/data/generation-${generation}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load Pokemon data for generation ${generation}`);
    }
    
    const pokemonData = await response.json();
    
    // スプライトURLを追加
    return pokemonData.map((pokemon: any) => {
      const style = getDefaultStyleForGeneration(generation);
      return {
        ...pokemon,
        sprites: {
          front_default: createSpriteUrl(pokemon.id, style, false),
          front_shiny: createSpriteUrl(pokemon.id, style, true),
        },
        description: pokemon.descriptions[generation] || { en: '', ja: '' }
      };
    });
  } catch (error) {
    console.error(`Error loading Pokemon data for generation ${generation}:`, error);
    return [];
  }
}

/**
 * ローカルJSONファイルからポケモンデータを取得する関数
 * @param generation 世代番号（1-9）
 * @returns その世代のポケモンデータ配列
 */
export async function fetchLocalPokemonData(generation: number): Promise<Pokemon[]> {
  try {
    const response = await fetch(`/data/generation-${generation}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch generation ${generation} data`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching local pokemon data for generation ${generation}:`, error);
    return [];
  }
}
