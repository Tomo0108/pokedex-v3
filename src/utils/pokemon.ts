import { SpriteStyles } from '@/types/pokemon';

// ローカルの画像パス
const LOCAL_SPRITES_BASE_URL = '/images';
// 画像が存在しない場合のフォールバック用のグレー画像URL
const FALLBACK_IMAGE_URL = '/images/no-sprite.png';

export const spriteStyles: SpriteStyles = {
  'ruby-sapphire': {
    path: '/generation-iii/ruby-sapphire',
    gens: [1, 2, 3],
    animated: false,
    displayName: { ja: 'ルビー・サファイア', en: 'Ruby-Sapphire' }
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
  },
  'x-y': {
    path: '/generation-vi/x-y',
    gens: [1, 2, 3, 4, 5, 6],
    animated: false,
    displayName: { ja: 'X・Y', en: 'X-Y' }
  },
  'sun-moon': {
    path: '/generation-vii/sun-moon',
    gens: [1, 2, 3, 4, 5, 6, 7, 8],
    animated: false,
    displayName: { ja: 'サン・ムーン', en: 'Sun-Moon' }
  },
  'scarlet-violet': {
    path: '/generation-ix',
    gens: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    animated: false,
    displayName: { ja: 'スカーレット・バイオレット', en: 'Scarlet-Violet' }
  }
};

export function getDefaultStyleForGeneration(generation: number): keyof typeof spriteStyles {
  if (generation <= 2) return 'ruby-sapphire'; // 第1-2世代は第3世代のruby-sapphireを使用
  if (generation === 3) return 'ruby-sapphire';
  if (generation === 4) return 'heartgold-soulsilver';
  if (generation === 5) return 'black-white';
  if (generation === 6) return 'x-y';
  if (generation === 7) return 'sun-moon';
  if (generation === 8) return 'sun-moon'; // 第8世代は第7世代のsun-moonを使用
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
  
  // 実際に存在するディレクトリに基づいて処理
  // 第1世代と第2世代のディレクトリが存在しない場合は、第3世代のruby-sapphireを使用
  if (generation <= 2) {
    const imagePath = shiny 
      ? `/images/generation-iii/ruby-sapphire/shiny/${pokemonId}.png`
      : `/images/generation-iii/ruby-sapphire/${pokemonId}.png`;
    
    // 画像が存在するか確認
    const exists = await checkImageExists(imagePath);
    if (!exists) {
      // shiny画像が存在しない場合は通常の画像を試す
      if (shiny) {
        const normalPath = `/images/generation-iii/ruby-sapphire/${pokemonId}.png`;
        const normalExists = await checkImageExists(normalPath);
        if (normalExists) {
          return normalPath;
        }
      }
      return FALLBACK_IMAGE_URL;
    }
    
    return imagePath;
  }
  
  // 第3世代のfirered-leafgreenディレクトリが存在しない場合は、ruby-sapphireを使用
  if (generation === 3 && style === 'firered-leafgreen') {
    const imagePath = shiny 
      ? `/images/generation-iii/ruby-sapphire/shiny/${pokemonId}.png`
      : `/images/generation-iii/ruby-sapphire/${pokemonId}.png`;
    
    // 画像が存在するか確認
    const exists = await checkImageExists(imagePath);
    if (!exists) {
      // shiny画像が存在しない場合は通常の画像を試す
      if (shiny) {
        const normalPath = `/images/generation-iii/ruby-sapphire/${pokemonId}.png`;
        const normalExists = await checkImageExists(normalPath);
        if (normalExists) {
          return normalPath;
        }
      }
      return FALLBACK_IMAGE_URL;
    }
    
    return imagePath;
  }
  
  // 第8世代のsword-shieldディレクトリが存在しない場合は、第7世代のsun-moonを使用
  if (generation === 8) {
    const imagePath = shiny 
      ? `/images/generation-vii/sun-moon/shiny/${pokemonId}.png`
      : `/images/generation-vii/sun-moon/${pokemonId}.png`;
    
    // 画像が存在するか確認
    const exists = await checkImageExists(imagePath);
    if (!exists) {
      // shiny画像が存在しない場合は通常の画像を試す
      if (shiny) {
        const normalPath = `/images/generation-vii/sun-moon/${pokemonId}.png`;
        const normalExists = await checkImageExists(normalPath);
        if (normalExists) {
          return normalPath;
        }
      }
      return FALLBACK_IMAGE_URL;
    }
    
    return imagePath;
  }
  
  // スタイル情報を取得
  const styleInfo = spriteStyles[style];
  
  // スタイルがサポートされていない場合は、世代に基づいてデフォルトのスタイルを使用
  if (!styleInfo || !styleInfo.gens.includes(generation)) {
    const defaultStyle = getDefaultStyleForGeneration(generation);
    return createSpriteUrl(pokemonId, defaultStyle, shiny);
  }
  
  // ファイル拡張子を設定（black-whiteスタイルの場合はgif、それ以外はpng）
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
      const normalPath = `/images${styleInfo.path}/${pokemonId}${ext}`;
      const normalExists = await checkImageExists(normalPath);
      if (normalExists) {
        return normalPath;
      }
    }
    return FALLBACK_IMAGE_URL;
  }
  
  return imagePath;
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
    const result = [];
    for (const pokemon of pokemonData) {
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
        description: getLatestDescription(pokemon.descriptions)
      });
    }
    
    return result;
  } catch (error) {
    console.error(`Error loading Pokemon data for generation ${generation}:`, error);
    return [];
  }
}
