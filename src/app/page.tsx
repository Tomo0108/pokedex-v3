'use client';

import { useState, useEffect } from 'react';
import { Pokemon, TypeTranslations, TypeColors, PokemonType, SpriteStyles } from '@/types/pokemon';
import { fetchPokemonData } from '@/utils/pokemon';
import { useStorage } from '@/utils/storage';
import Image from 'next/image';

// スケルトンUIコンポーネント
const PokemonSkeleton = () => (
  <div className="border rounded-lg p-4 flex flex-col items-center animate-pulse">
    <div className="bg-gray-200 h-6 w-16 mb-2 rounded"></div>
    <div className="bg-gray-200 h-32 w-32 rounded"></div>
    <div className="bg-gray-200 h-6 w-32 mt-2 rounded"></div>
    <div className="flex gap-2 mt-2">
      <div className="bg-gray-200 h-6 w-16 rounded"></div>
      <div className="bg-gray-200 h-6 w-16 rounded"></div>
    </div>
    <div className="bg-gray-200 h-20 w-full mt-2 rounded"></div>
  </div>
);

// 世代の定義
const generations = [
  { id: 1, name: '第1世代', years: '1996-1999' },
  { id: 2, name: '第2世代', years: '1999-2002' },
  { id: 3, name: '第3世代', years: '2002-2006' },
  { id: 4, name: '第4世代', years: '2006-2010' },
  { id: 5, name: '第5世代', years: '2010-2013' },
  { id: 6, name: 'XY', years: '2013-2016' },
  { id: 7, name: 'サンムーン', years: '2016-2019' },
  { id: 8, name: 'ソードシールド', years: '2019-2022' },
  { id: 9, name: 'スカーレット・バイオレット', years: '2022-' }
] as const;

// タイプの翻訳とカラー定義に型を適用
const typeTranslations: TypeTranslations = {
  normal: 'ノーマル',
  fire: 'ほのお',
  water: 'みず',
  electric: 'でんき',
  grass: 'くさ',
  ice: 'こおり',
  fighting: 'かくとう',
  poison: 'どく',
  ground: 'じめん',
  flying: 'ひこう',
  psychic: 'エスパー',
  bug: 'むし',
  rock: 'いわ',
  ghost: 'ゴースト',
  dragon: 'ドラゴン',
  dark: 'あく',
  steel: 'はがね',
  fairy: 'フェアリー'
};

const typeColors: TypeColors = {
  normal: 'bg-gray-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  electric: 'bg-yellow-400',
  grass: 'bg-green-500',
  ice: 'bg-blue-200',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-yellow-600',
  flying: 'bg-indigo-400',
  psychic: 'bg-pink-500',
  bug: 'bg-green-600',
  rock: 'bg-yellow-800',
  ghost: 'bg-purple-700',
  dragon: 'bg-indigo-600',
  dark: 'bg-gray-800',
  steel: 'bg-gray-500',
  fairy: 'bg-pink-300'
};

// スプライトスタイルの定義
const spriteStyles: SpriteStyles = {
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

export default function Home() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [generation, setGeneration] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getSpriteStyle, setSpriteStyle, getShiny, setShiny } = useStorage();
  const [selectedStyle, setSelectedStyle] = useState(getSpriteStyle());
  const [isShiny, setIsShiny] = useState(getShiny());
  
  useEffect(() => {
    const loadPokemon = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await fetchPokemonData(generation);
        setPokemonList(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    loadPokemon();
  }, [generation]);

  useEffect(() => {
    setSpriteStyle(selectedStyle);
  }, [selectedStyle]);

  useEffect(() => {
    setShiny(isShiny);
  }, [isShiny]);

  // 現在の世代で利用可能なスプライトスタイルを取得
  const availableStyles = Object.entries(spriteStyles)
    .filter(([_, style]) => style.gens.includes(generation))
    .reduce((acc, [key, style]) => {
      acc[key] = style;
      return acc;
    }, {} as SpriteStyles);

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-lg">
          <p>エラーが発生しました</p>
          <p className="text-sm mt-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">ポケモン図鑑</h1>
      <div className="mb-4">
        <h2 className="text-xl mb-2">世代選択</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {generations.map((gen) => (
            <button
              key={gen.id}
              onClick={() => setGeneration(gen.id)}
              className={`px-4 py-2 rounded ${
                generation === gen.id ? 'bg-blue-500 text-white' : 'bg-gray-200'
              } hover:bg-blue-400 hover:text-white transition-colors`}
              title={gen.years}
            >
              {gen.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(availableStyles).length > 1 && (
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="px-4 py-2 rounded bg-gray-200"
            >
              {Object.entries(availableStyles).map(([key, style]) => (
                <option key={key} value={key}>
                  {style.displayName.ja}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isShiny}
              onChange={(e) => setIsShiny(e.target.checked)}
            />
            色違い
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 12 }).map((_, index) => (
            <PokemonSkeleton key={index} />
          ))
        ) : (
          pokemonList.map((pokemon) => (
            <div key={pokemon.id} className="border rounded-lg p-4 flex flex-col items-center">
              <div className="text-gray-500">#{String(pokemon.id).padStart(3, '0')}</div>
              <div className="relative w-32 h-32">
                <Image
                  src={isShiny ? pokemon.sprites!.front_shiny : pokemon.sprites!.front_default}
                  alt={pokemon.name}
                  fill
                  className="object-contain"
                  sizes="128px"
                  priority={pokemon.id <= 12}
                />
              </div>
              <h2 className="text-xl font-bold mt-2">{pokemon.japaneseName}</h2>
              <div className="flex gap-2 mt-2">
                {pokemon.types.map((type) => (
                  <span
                    key={type}
                    className={`px-2 py-1 rounded text-sm text-white ${typeColors[type]}`}
                  >
                    {typeTranslations[type]}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {pokemon.description?.ja || '説明文がありません'}
              </p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
