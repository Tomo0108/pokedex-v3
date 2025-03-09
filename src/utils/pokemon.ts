import { SpriteStyles, Pokemon } from '@/types/pokemon';
import axios from 'axios';

// ローカルの画像パス
const LOCAL_SPRITES_BASE_URL = '/images';
// 画像が存在しない場合のフォールバック用のグレー画像URL
const FALLBACK_IMAGE_URL = '/images/no-sprite.png';

// 各スタイルで利用可能なポケモンIDの範囲
type PokemonRange = { min: number; max: number; };
type AvailablePokemon = {
  ranges: PokemonRange[];
  exceptions?: number[]; // 範囲外でも利用可能なID
};

// 各スタイルで実際に利用可能なポケモンを定義
const availablePokemon: { [key: string]: AvailablePokemon } = {
  'red-blue': {
    ranges: [{ min: 1, max: 151 }]
  },
  'crystal': {
    ranges: [{ min: 1, max: 251 }]
  },
  'firered-leafgreen': {
    ranges: [{ min: 1, max: 151 }]
  },
  'emerald': {
    ranges: [{ min: 1, max: 386 }]
  },
  'diamond-pearl': {
    ranges: [{ min: 1, max: 493 }]
  },
  'black-white': {
    ranges: [{ min: 1, max: 649 }]
  },
  'x-y': {
    ranges: [{ min: 1, max: 721 }]
  },
  'sun-moon': {
    ranges: [{ min: 1, max: 809 }]
  },
  'sword-shield': {
    ranges: [{ min: 1, max: 905 }]
  },
  'scarlet-violet': {
    ranges: [{ min: 1, max: 1025 }]
  }
};

export const spriteStyles: SpriteStyles = {
  'red-blue': {
    path: '/generation-i/red-blue',
    gens: [1],
    animated: false,
    displayName: { ja: 'レッド・ブルー', en: 'Red-Blue' }
  },
  'crystal': {
    path: '/generation-ii/crystal',
    gens: [1, 2],
    animated: true,
    displayName: { ja: 'クリスタル', en: 'Crystal' }
  },
  'firered-leafgreen': {
    path: '/generation-iii/firered-leafgreen',
    gens: [1],
    animated: false,
    displayName: { ja: 'ファイアレッド・リーフグリーン', en: 'FireRed-LeafGreen' }
  },
  'emerald': {
    path: '/generation-iii/emerald',
    gens: [1, 2, 3],
    animated: false,
    displayName: { ja: 'エメラルド', en: 'Emerald' }
  },
  'diamond-pearl': {
    path: '/generation-iv/diamond-pearl',
    gens: [1, 2, 3, 4],
    animated: false,
    displayName: { ja: 'ダイヤモンド・パール', en: 'Diamond-Pearl' }
  },
  'black-white': {
    path: '/generation-v/black-white',
    gens: [1, 2, 3, 4, 5],
    animated: true,
    displayName: { ja: 'ブラック・ホワイト', en: 'Black-White' }
  },
  'x-y': {
    path: '/generation-vi/x-y',
    gens: [1, 2, 3, 4, 5, 6],
    animated: false,
    displayName: { ja: 'X・Y', en: 'X-Y' }
  },
  'sun-moon': {
    path: '/generation-vii/sun-moon',
    gens: [1, 2, 3, 4, 5, 6, 7],
    animated: false,
    displayName: { ja: 'サン・ムーン', en: 'Sun-Moon' }
  },
  'sword-shield': {
    path: '/generation-viii/sword-shield',
    gens: [1, 2, 3, 4, 5, 6, 7, 8],
    animated: false,
    displayName: { ja: 'ソード・シールド', en: 'Sword-Shield' }
  },
  'scarlet-violet': {
    path: '/generation-ix/scarlet-violet',
    gens: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    animated: false,
    displayName: { ja: 'スカーレット・バイオレット', en: 'Scarlet-Violet' }
  }
};

export function getDefaultStyleForGeneration(generation: number): keyof typeof spriteStyles {
  switch (generation) {
    case 1:
      return 'red-blue';
    case 2:
      return 'crystal';
    case 3:
      return 'emerald';
    case 4:
      return 'diamond-pearl';
    case 5:
      return 'black-white';
    case 6:
      return 'x-y';
    case 7:
      return 'sun-moon';
    case 8:
      return 'sword-shield';
    case 9:
      return 'scarlet-violet';
    default:
      return 'red-blue';
  }
}

// 指定されたIDのポケモンがスタイルで利用可能かチェック
function isPokemonAvailableInStyle(pokemonId: number, style: keyof typeof spriteStyles): boolean {
  const available = availablePokemon[style];
  if (!available) return false;

  // 例外リストにある場合は利用可能
  if (available.exceptions?.includes(pokemonId)) return true;

  // 範囲内にある場合は利用可能
  return available.ranges.some(range => 
    pokemonId >= range.min && pokemonId <= range.max
  );
}

export function createSpriteUrl(pokemonId: number, style: keyof typeof spriteStyles, shiny: boolean = false, form?: string): string {
  // ポケモンIDから世代を判定
  const generation = 
    pokemonId <= 151 ? 1 :
    pokemonId <= 251 ? 2 :
    pokemonId <= 386 ? 3 :
    pokemonId <= 493 ? 4 :
    pokemonId <= 649 ? 5 :
    pokemonId <= 721 ? 6 :
    pokemonId <= 809 ? 7 :
    pokemonId <= 905 ? 8 :
    pokemonId <= 1025 ? 9 : 9; // 9世代は906~1025
  
  // スタイル情報を取得
  const styleInfo = spriteStyles[style];
  
  // スタイルが指定の世代をサポートしていないか、ポケモンが利用できない場合は
  // 世代に基づいてデフォルトのスタイルを使用
  if (!styleInfo || !styleInfo.gens.includes(generation) || !isPokemonAvailableInStyle(pokemonId, style)) {
    const defaultStyle = getDefaultStyleForGeneration(generation);
    return createSpriteUrl(pokemonId, defaultStyle, shiny, form);
  }
  
  // 拡張子を設定（black-whiteスタイルの場合はgif、それ以外はwebp）
  const ext = style === 'black-white' ? '.gif' : '.webp';
  
  // フォルムが指定されている場合はファイル名に追加
  const fileName = form ? `${pokemonId}-${form}` : `${pokemonId}`;
  
  // 画像パスを生成
  const imagePath = shiny 
    ? `/images${styleInfo.path}/shiny/${fileName}${ext}`
    : `/images${styleInfo.path}/${fileName}${ext}`;
  
  return imagePath;
}

function getLatestDescription(descriptions: { [key: number]: { en: string; ja: string }}, currentGen: number): { en: string; ja: string } {
  // 世代の配列を取得し、現在の世代から降順でソート
  const generations = Object.keys(descriptions)
    .map(Number)
    .filter(gen => gen <= currentGen)
    .sort((a, b) => b - a);

  if (generations.length > 0) {
    // 最新の世代の説明を返す
    const latestGen = generations[0];
    return descriptions[latestGen];
  }

  return { en: '', ja: '' };
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
    const [start, end] = ranges[generation as keyof typeof ranges];
    const style = getDefaultStyleForGeneration(generation);
    const pokemonList: Pokemon[] = [];

    for (let id = start; id <= end; id++) {
      // PokeAPIからポケモンの基本データを取得
      const pokemonResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const speciesResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
      
      // 日本語の名前を取得
      const japaneseName = speciesResponse.data.names.find(
        (name: any) => name.language.name === 'ja'
      )?.name || '';

      // タイプを取得
      const types = pokemonResponse.data.types.map((type: any) => type.type.name);

      // 説明文を取得
      const descriptions = speciesResponse.data.flavor_text_entries;
      const enDescription = descriptions.find(
        (desc: any) => desc.language.name === 'en'
      )?.flavor_text || '';
      const jaDescription = descriptions.find(
        (desc: any) => desc.language.name === 'ja'
      )?.flavor_text || '';

      const pokemon: Pokemon = {
        id,
        name: pokemonResponse.data.name,
        japaneseName,
        types,
        sprites: {
          front_default: createSpriteUrl(id, style, false),
          front_shiny: createSpriteUrl(id, style, true),
        },
        description: {
          en: enDescription.replace(/\f/g, ' '),
          ja: jaDescription.replace(/\f/g, ' '),
        }
      };

      pokemonList.push(pokemon);
    }

    return pokemonList;
  } catch (error) {
    console.error(`Error loading Pokemon data for generation ${generation}:`, error);
    return [];
  }
}
