import { SpriteStyles } from '@/types/pokemon';

const SPRITES_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const POKEAPI_URL = process.env.NEXT_PUBLIC_POKEAPI_URL;
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

export async function createSpriteUrl(id: number, style: keyof typeof spriteStyles | '', shiny: boolean): Promise<string> {
  const baseUrl = SPRITES_BASE_URL;
  const spriteStyle = spriteStyles[style as keyof typeof spriteStyles];

  // デフォルトのスプライトURL
  const defaultUrl = shiny ? 
    `${baseUrl}/shiny/${id}.png` :
    `${baseUrl}/${id}.png`;

  if (!spriteStyle || !style) {
    // デフォルトスプライトが存在するか確認
    if (await checkImageExists(defaultUrl)) {
      return defaultUrl;
    }
    return FALLBACK_IMAGE_URL;
  }

  // アニメーション対応のブラック・ホワイトスプライト
  if (style === 'black-white') {
    const animatedUrl = `${baseUrl}${spriteStyle.path}/${shiny ? 'shiny/' : ''}${id}.gif`;
    const staticUrl = `${baseUrl}/versions/generation-v/black-white/${shiny ? 'shiny/' : ''}${id}.png`;

    // まずアニメーションGIFをチェック
    if (await checkImageExists(animatedUrl)) {
      return animatedUrl;
    }

    // 次に静的なBWスプライトをチェック
    if (await checkImageExists(staticUrl)) {
      return staticUrl;
    }

    // 最後にデフォルトスプライトをチェック
    if (await checkImageExists(defaultUrl)) {
      return defaultUrl;
    }

    // どの画像も存在しない場合はフォールバック画像を返す
    console.warn(`No sprite found for Pokemon #${id}, using fallback image`);
    return FALLBACK_IMAGE_URL;
  }

  // その他の世代のスプライト
  const generationUrl = `${baseUrl}${spriteStyle.path}/${shiny ? 'shiny/' : ''}${id}.png`;
  
  // まず世代別スプライトをチェック
  if (await checkImageExists(generationUrl)) {
    return generationUrl;
  }
  
  // 次にデフォルトスプライトをチェック
  if (await checkImageExists(defaultUrl)) {
    return defaultUrl;
  }

  // どの画像も存在しない場合はフォールバック画像を返す
  console.warn(`No sprite found for Pokemon #${id}, using fallback image`);
  return FALLBACK_IMAGE_URL;
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

  const [start, end] = ranges[generation as keyof typeof ranges] || [1, 151];
  const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  // Clear existing cache to fetch fresh data with new sprite URLs
  const cache = await caches.open('pokemon-data');
  await cache.delete(`/api/pokemon?gen=${generation}`);

  const cacheKey = `/api/pokemon?gen=${generation}`;

  const pokemonData = await Promise.all(ids.map(async id => {
    try {
      const [pokemonRes, speciesRes] = await Promise.all([
        fetch(`${POKEAPI_URL}/pokemon/${id}`),
        fetch(`${POKEAPI_URL}/pokemon-species/${id}`)
      ]);

      if (!pokemonRes.ok || !speciesRes.ok) {
        throw new Error(`Failed to fetch Pokemon data for #${id}`);
      }

      const [pokemon, species] = await Promise.all([
        pokemonRes.json(),
        speciesRes.json()
      ]);

      const enDescription = await getLatestDescription(species.flavor_text_entries, 'en', generation);
      const jaDescription = await getLatestDescription(species.flavor_text_entries, 'ja', generation);
      const jaName = species.names.find((name: any) => name.language.name === 'ja')?.name || pokemon.name;

      const style = getDefaultStyleForGeneration(generation);
      const [spriteUrl, shinyUrl] = await Promise.all([
        createSpriteUrl(pokemon.id, style, false),
        createSpriteUrl(pokemon.id, style, true)
      ]);

      return {
        id: pokemon.id,
        name: pokemon.name,
        japaneseName: jaName,
        sprites: {
          front_default: spriteUrl,
          front_shiny: shinyUrl,
        },
        description: {
          en: enDescription,
          ja: jaDescription
        }
      };
    } catch (error) {
      console.error(`Error fetching Pokemon #${id}:`, error);
      return null;
    }
  }));

  const filteredPokemonData = pokemonData.filter(data => data !== null);
  cache.put(cacheKey, new Response(JSON.stringify(filteredPokemonData)));
  return filteredPokemonData;
}
