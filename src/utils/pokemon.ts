import { SpriteStyles } from '@/types/pokemon';

// ローカルの画像パス
const LOCAL_SPRITES_BASE_URL = '/images';
// 画像が存在しない場合のフォールバック用のグレー画像URL
const FALLBACK_IMAGE_URL = '/images/no-sprite.png';

export const spriteStyles: SpriteStyles = {
  'red-blue': {
    path: '/generation-i/red-blue',
    gens: [1],
    animated: false,
    displayName: { ja: 'Red・Blue', en: 'Red-Blue' }
  },
  'yellow': {
    path: '/generation-i/yellow',
    gens: [1],
    animated: false,
    displayName: { ja: 'イエロー', en: 'Yellow' }
  },
  'crystal': {
    path: '/generation-ii/crystal',
    gens: [2],
    animated: false,
    displayName: { ja: 'クリスタル', en: 'Crystal' }
  },
  'gold': {
    path: '/generation-ii/gold',
    gens: [2],
    animated: false,
    displayName: { ja: 'ゴールド', en: 'Gold' }
  },
  'silver': {
    path: '/generation-ii/silver',
    gens: [2],
    animated: false,
    displayName: { ja: 'シルバー', en: 'Silver' }
  },
  'emerald': {
    path: '/generation-iii/emerald',
    gens: [3],
    animated: false,
    displayName: { ja: 'エメラルド', en: 'Emerald' }
  },
  'firered-leafgreen': {
    path: '/generation-iii/firered-leafgreen',
    gens: [3],
    animated: false,
    displayName: { ja: 'FR・LG', en: 'FR-LG' }
  },
  'ruby-sapphire': {
    path: '/generation-iii/ruby-sapphire',
    gens: [3],
    animated: false,
    displayName: { ja: 'ルビー・サファイア', en: 'Ruby-Sapphire' }
  },
  'diamond-pearl': {
    path: '/generation-iv/diamond-pearl',
    gens: [4],
    animated: false,
    displayName: { ja: 'ダイヤモンド・パール', en: 'Diamond-Pearl' }
  },
  'heartgold-soulsilver': {
    path: '/generation-iv/heartgold-soulsilver',
    gens: [4],
    animated: false,
    displayName: { ja: 'HG・SS', en: 'HG-SS' }
  },
  'platinum': {
    path: '/generation-iv/platinum',
    gens: [4],
    animated: false,
    displayName: { ja: 'プラチナ', en: 'Platinum' }
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
  if (generation === 1) return 'red-blue';
  if (generation === 2) return 'crystal';
  if (generation === 3) return 'ruby-sapphire';
  if (generation === 4) return 'platinum';
  if (generation === 5) return 'black-white';
  if (generation === 6) return 'x-y';
  if (generation === 7) return 'sun-moon';
  if (generation === 8) return 'sword-shield';
  if (generation === 9) return 'scarlet-violet';
  return 'black-white';
}

async function checkImageExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export async function createSpriteUrl(pokemonId: number, style: keyof typeof spriteStyles, shiny: boolean = false): Promise<string> {
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
  
  // 画像が存在するか確認
  const exists = await checkImageExists(imagePath);
  if (!exists) {
    // shiny画像が存在しない場合は通常の画像を試す
    if (shiny) {
      const normalPath = `/images${styleInfo.path}/${pokemonId}.png`;
      const normalExists = await checkImageExists(normalPath);
      if (normalExists) {
        return normalPath;
      }
    }
    return FALLBACK_IMAGE_URL;
  }
  
  return imagePath;
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
    const result = [];
    for (const pokemon of pokemonData) {
      const style = getDefaultStyleForGeneration(generation);
      
      // 説明文を取得
      const description = pokemon.descriptions ? {
        en: pokemon.descriptions.en || '',
        ja: pokemon.descriptions.ja || ''
      } : { en: '', ja: '' };
      
      let front_default, front_shiny;
      
      if (generation >= 6) {
        front_default = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
        front_shiny = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`;
      } else {
        front_default = await createSpriteUrl(pokemon.id, style, false);
        front_shiny = await createSpriteUrl(pokemon.id, style, true);
      }
      
      result.push({
        ...pokemon,
        sprites: {
          front_default,
          front_shiny,
        },
        description
      });
    }
    
    return result;
  } catch (error) {
    console.error(`Error loading Pokemon data for generation ${generation}:`, error);
    return [];
  }
}
