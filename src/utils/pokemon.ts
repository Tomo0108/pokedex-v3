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
    displayName: { ja: '赤・青', en: 'Red-Blue' }
  },
  'yellow': {
    path: '/generation-i/yellow',
    gens: [1],
    animated: false,
    displayName: { ja: 'ピカチュウ', en: 'Yellow' }
  },
  'gold': {
    path: '/generation-ii/gold',
    gens: [1, 2],
    animated: false,
    displayName: { ja: '金', en: 'Gold' }
  },
  'silver': {
    path: '/generation-ii/silver',
    gens: [1, 2],
    animated: false,
    displayName: { ja: '銀', en: 'Silver' }
  },
  'crystal': { 
    path: '/generation-ii/crystal',
    gens: [1, 2],
    animated: false,
    displayName: { ja: 'クリスタル', en: 'Crystal' }
  },
  'ruby-sapphire': {
    path: '/generation-iii/ruby-sapphire',
    gens: [1, 2, 3],
    animated: false,
    displayName: { ja: 'ルビー・サファイア', en: 'Ruby-Sapphire' }
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
    displayName: { ja: 'FR・LG', en: 'FR-LG' }
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
    displayName: { ja: 'HG・SS', en: 'HG-SS' }
  },
  'black-white': {
    path: '/generation-v/black-white',
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
  // 9世代のポケモンの場合は特別なパスを使用
  if (pokemonId > 905) {
    return `/sprites/pokemon/versions/generation-ix/${pokemonId}${shiny ? '-shiny' : ''}.png`;
  }

  const styleInfo = spriteStyles[style];
  const generation = Math.ceil(pokemonId / 151);
  
  // スタイルが対応していない世代の場合
  if (!styleInfo.gens.includes(generation)) {
    return `/icons/substitute.png`;
  }
  
  const shinyPath = shiny ? '/shiny' : '';
  
  // black-whiteスタイルの場合はGIF拡張子を使用
  const extension = style === 'black-white' ? '.gif' : '.png';
  
  // ローカルの画像パスを使用
  const spriteUrl = `${LOCAL_SPRITES_BASE_URL}${styleInfo.path}${shinyPath}/${pokemonId}${extension}`;
  
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
      
      // 最新の説明文を取得
      const getLatestDescription = (descriptions: any) => {
        if (!descriptions) return { en: '', ja: '' };
        
        // 世代番号の降順でソートされた配列を作成
        const genNumbers = Object.keys(descriptions)
          .map(Number)
          .filter(gen => gen <= 9) // 全世代対応
          .sort((a, b) => b - a); // 降順ソート
        
        // 最新の世代の説明を取得
        if (genNumbers.length > 0) {
          // 日本語の説明がある世代を優先
          for (const gen of genNumbers) {
            const desc = descriptions[gen];
            if (desc && desc.ja && desc.ja.trim() !== '') {
              return {
                en: desc.en || '',
                ja: desc.ja || ''
              };
            }
          }
          
          // 日本語がなければ最新の英語説明を使用
          const latestGen = genNumbers[0];
          const description = descriptions[latestGen];
          
          return {
            en: description?.en || '',
            ja: description?.ja || ''
          };
        }
        
        return { en: '', ja: '' };
      };
      
      return {
        ...pokemon,
        sprites: {
          front_default: generation >= 6 
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
            : createSpriteUrl(pokemon.id, style, false),
          front_shiny: generation >= 6
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.id}.png`
            : createSpriteUrl(pokemon.id, style, true),
        },
        description: getLatestDescription(pokemon.descriptions)
      };
    });
  } catch (error) {
    console.error(`Error loading Pokemon data for generation ${generation}:`, error);
    return [];
  }
}
