import { NextRequest } from 'next/server';
import { Pokemon } from '@/types/pokemon';

const POKEAPI_URL = process.env.NEXT_PUBLIC_POKEAPI_URL;

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

async function fetchPokemonDetails(id: number): Promise<Pokemon> {
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

  return {
    id: pokemon.id,
    name: pokemon.name,
    japaneseName: jaName,
    sprites: {
      front_default: pokemon.sprites.front_default,
      front_shiny: pokemon.sprites.front_shiny,
    },
    description: {
      en: enDescription,
      ja: jaDescription
    },
    types: pokemon.types.map((t: any) => t.type.name)
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gen = parseInt(searchParams.get('gen') || '1');

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

  const [start, end] = ranges[gen as keyof typeof ranges] || [1, 151];
  const ids = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  try {
    const pokemonData = await Promise.all(
      ids.map(id => fetchPokemonDetails(id))
    );

    return Response.json(pokemonData);
  } catch (error) {
    console.error('Failed to fetch Pokemon data:', error);
    return Response.json({ error: 'Failed to fetch Pokemon data' }, { status: 500 });
  }
}
