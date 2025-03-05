import { SpriteStyles, Pokemon } from '@/types/pokemon';

// ローカルの画像パス
const LOCAL_SPRITES_BASE_URL = '/images';
// 画像が存在しない場合のフォールバック用のグレー画像URL
const FALLBACK_IMAGE_URL = '/images/no-sprite.png';

export const spriteStyles: SpriteStyles = {
  'emerald': {
    path: '/generation-iii/emerald',
    gens: [1, 2, 3, 4],
    animated: false,
    displayName: { ja: 'エメラルド', en: 'Emerald' }
  },
  'black-white': {
    path: '/generation-v/black-white',
    gens: [5],
    animated: true,
    displayName: { ja: 'ブラック・ホワイト', en: 'Black-White' }
  },
  'x-y': {
    path: '/generation-vi/x-y',
    gens: [6],
    animated: false,
    displayName: { ja: 'X・Y', en: 'X-Y' }
  },
  'sun-moon': {
    path: '/generation-vii/sun-moon',
    gens: [7],
    animated: false,
    displayName: { ja: 'サン・ムーン', en: 'Sun-Moon' }
  },
  'sword-shield': {
    path: '/generation-viii/sword-shield',
    gens: [8],
    animated: false,
    displayName: { ja: 'ソード・シールド', en: 'Sword-Shield' }
  },
  'scarlet-violet': {
    path: '/generation-ix/scarlet-violet',
    gens: [9],
    animated: false,
    displayName: { ja: 'スカーレット・バイオレット', en: 'Scarlet-Violet' }
  }
};

export function getDefaultStyleForGeneration(generation: number): keyof typeof spriteStyles {
  if (generation <= 4) return 'emerald';
  if (generation === 5) return 'black-white';
  if (generation === 6) return 'x-y';
  if (generation === 7) return 'sun-moon';
  if (generation === 8) return 'sword-shield';
  if (generation === 9) return 'scarlet-violet';
  return 'emerald';
}

export function createSpriteUrl(pokemonId: number, style: keyof typeof spriteStyles, shiny: boolean = false): string {
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
  
  // スタイルが指定の世代をサポートしていない場合は、世代に基づいてデフォルトのスタイルを使用
  if (!styleInfo || !styleInfo.gens.includes(generation)) {
    const defaultStyle = getDefaultStyleForGeneration(generation);
    return createSpriteUrl(pokemonId, defaultStyle, shiny);
  }
  
  // 拡張子を設定（black-whiteスタイルの場合はgif、それ以外はpng）
  const ext = style === 'black-white' ? '.gif' : '.png';
  
  // 画像パスを生成
  const imagePath = shiny 
    ? `/images${styleInfo.path}/shiny/${pokemonId}${ext}`
    : `/images${styleInfo.path}/${pokemonId}${ext}`;
  
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
        front_default: createSpriteUrl(pokemon.id, style, false),
        front_shiny: createSpriteUrl(pokemon.id, style, true),
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
