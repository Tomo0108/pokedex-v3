import { SpriteStyles } from '@/types/pokemon';

const SPRITES_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const POKEAPI_URL = process.env.NEXT_PUBLIC_POKEAPI_URL;

export const spriteStyles: SpriteStyles = {
  gb: { 
    path: '/versions/generation-i/red-blue/transparent',
    gens: [1],
    animated: false
  },
  crystal: { 
    path: '/versions/generation-ii/crystal/transparent',
    gens: [1, 2],
    animated: false
  },
  emerald: { 
    path: '/versions/generation-iii/emerald',
    gens: [1, 2, 3],
    animated: false
  },
  dp: { 
    path: '/versions/generation-iv/diamond-pearl',
    gens: [1, 2, 3, 4],
    animated: false
  },
  bw: { 
    path: '/versions/generation-v/black-white/animated',
    gens: [1, 2, 3, 4, 5],
    animated: true
  }
};

export function getDefaultStyleForGeneration(generation: number): keyof typeof spriteStyles {
  if (generation <= 1) return 'gb';
  if (generation === 2) return 'crystal';
  if (generation === 3) return 'emerald';
  if (generation === 4) return 'dp';
  if (generation <= 5) return 'bw';
  return 'bw';
}

export async function createSpriteUrl(id: number, style: keyof typeof spriteStyles | '', shiny: boolean): Promise<string> {
  const baseUrl = SPRITES_BASE_URL;
  const spriteStyle = spriteStyles[style as keyof typeof spriteStyles];

  if (!spriteStyle || !style) {
    return shiny ? 
      `${baseUrl}/shiny/${id}.png` :
      `${baseUrl}/${id}.png`;
  }

  // アニメーション対応のBWスプライト
  if (style === 'bw') {
    const animatedUrl = `${baseUrl}${spriteStyle.path}/${shiny ? 'shiny/' : ''}${id}.gif`;
    try {
      const response = await fetch(animatedUrl);
      if (response.ok) {
        return animatedUrl;
      }
    } catch (error) {
      console.warn(`Animated sprite not found for Pokemon #${id}, falling back to static`);
    }
    // 静的なBWスプライトにフォールバック
    return `${baseUrl}/versions/generation-v/black-white/${shiny ? 'shiny/' : ''}${id}.png`;
  }

  // その他の世代のスプライト
  return `${baseUrl}${spriteStyle.path}/${shiny ? 'shiny/' : ''}${id}.png`;
}

async function getLatestDescription(entries: any[], language: string) {
  const validEntries = entries
    .filter(entry => entry.language.name === language && entry.version)
    .sort((a, b) => {
      const versionA = parseInt(a.version.url.split('/')[6]);
      const versionB = parseInt(b.version.url.split('/')[6]);
      return versionB - versionA;
    });

  return validEntries[0]?.flavor_text.replace(/[\n\f]/g, ' ') || '';
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
    9: [906, 1010],
  };

  const [start, end] = ranges[generation as keyof typeof ranges] || [1, 151];
  const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  // Clear existing cache to fetch fresh data with new sprite URLs
  const cache = await caches.open('pokemon-data');
  await cache.delete(`/api/pokemon?gen=${generation}`);

  const cacheKey = `/api/pokemon?gen=${generation}`;

  const pokemonData = await Promise.all(ids.map(async id => {
    const [pokemonRes, speciesRes] = await Promise.all([
      fetch(`${POKEAPI_URL}/pokemon/${id}`),
      fetch(`${POKEAPI_URL}/pokemon-species/${id}`)
    ]);

    const [pokemon, species] = await Promise.all([
      pokemonRes.json(),
      speciesRes.json()
    ]);

    const enDescription = await getLatestDescription(species.flavor_text_entries, 'en');
    const jaDescription = await getLatestDescription(species.flavor_text_entries, 'ja');
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
  }));

  cache.put(cacheKey, new Response(JSON.stringify(pokemonData)));
  return pokemonData;
}
