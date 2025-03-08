import { SpriteStyles, Pokemon } from '@/types/pokemon';

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
  'yellow': {
    ranges: [{ min: 1, max: 151 }]
  },
  'gold': {
    ranges: [{ min: 1, max: 251 }]
  },
  'silver': {
    ranges: [{ min: 1, max: 251 }]
  },
  'crystal': {
    ranges: [{ min: 1, max: 251 }]
  },
  'emerald': {
    ranges: [{ min: 1, max: 386 }]
  },
  'firered-leafgreen': {
    ranges: [{ min: 1, max: 386 }]
  },
  'diamond-pearl': {
    ranges: [{ min: 1, max: 493 }]
  },
  'platinum': {
    ranges: [{ min: 1, max: 493 }]
  },
  'heartgold-soulsilver': {
    ranges: [{ min: 1, max: 493 }]
  },
  'black-white': {
    ranges: [{ min: 1, max: 649 }]
  },
  'x-y': {
    ranges: [{ min: 650, max: 721 }]
  },
  'sun-moon': {
    ranges: [{ min: 722, max: 809 }]
  },
  'sword-shield': {
    ranges: [{ min: 810, max: 905 }]
  },
  'scarlet-violet': {
    ranges: [{ min: 906, max: 1025 }]
  }
};

export const spriteStyles: SpriteStyles = {
  'red-blue': {
    path: '/generation-i/red-blue',
    gens: [1],
    animated: false,
    displayName: { ja: 'レッド・ブルー', en: 'Red-Blue' }
  },
  'yellow': {
    path: '/generation-i/yellow',
    gens: [1],
    animated: false,
    displayName: { ja: 'イエロー', en: 'Yellow' }
  },
  'gold': {
    path: '/generation-ii/gold',
    gens: [1, 2],
    animated: false,
    displayName: { ja: 'ゴールド', en: 'Gold' }
  },
  'silver': {
    path: '/generation-ii/silver',
    gens: [1, 2],
    animated: false,
    displayName: { ja: 'シルバー', en: 'Silver' }
  },
  'crystal': {
    path: '/generation-ii/crystal',
    gens: [1, 2],
    animated: true,
    displayName: { ja: 'クリスタル', en: 'Crystal' }
  },
  'emerald': {
    path: '/generation-iii/emerald',
    gens: [1, 2, 3],
    animated: false,
    displayName: { ja: 'エメラルド', en: 'Emerald' }
  },
  'firered-leafgreen': {
    path: '/generation-iii/firered-leafgreen',
    gens: [1, 2, 3],
    animated: false,
    displayName: { ja: 'ファイアレッド・リーフグリーン', en: 'FireRed-LeafGreen' }
  },
  'diamond-pearl': {
    path: '/generation-iv/diamond-pearl',
    gens: [1, 2, 3, 4],
    animated: false,
    displayName: { ja: 'ダイヤモンド・パール', en: 'Diamond-Pearl' }
  },
  'platinum': {
    path: '/generation-iv/platinum',
    gens: [1, 2, 3, 4],
    animated: false,
    displayName: { ja: 'プラチナ', en: 'Platinum' }
  },
  'heartgold-soulsilver': {
    path: '/generation-iv/heartgold-soulsilver',
    gens: [1, 2, 3, 4],
    animated: false,
    displayName: { ja: 'ハートゴールド・ソウルシルバー', en: 'HeartGold-SoulSilver' }
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
    // ローカルのJSONファイルからデータを読み込む
    const response = await fetch(`/data/generation-${generation}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load Pokemon data for generation ${generation}`);
    }
    
    const pokemonData: Pokemon[] = await response.json();
    const style = getDefaultStyleForGeneration(generation);
    
    // スプライトURLを追加
    return pokemonData.map((pokemon: Pokemon) => ({
      ...pokemon,
      sprites: {
        front_default: createSpriteUrl(pokemon.id, style, false, pokemon.form),
        front_shiny: createSpriteUrl(pokemon.id, style, true, pokemon.form),
      },
      description: pokemon.descriptions 
        ? getLatestDescription(pokemon.descriptions, generation)
        : { en: '', ja: '' }
    }));
    
  } catch (error) {
    console.error(`Error loading Pokemon data for generation ${generation}:`, error);
    return [];
  }
}
