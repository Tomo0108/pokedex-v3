'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Pokemon } from '@/types/pokemon';
import { fetchPokemonData, spriteStyles, createSpriteUrl, getDefaultStyleForGeneration } from '@/utils/pokemon';
import { prefetchAllGenerations } from '@/utils/cache';
import { storage, StorageValue } from '@/utils/storage';
import { isPartialMatch } from '@/utils/kana';
import { createLoadingGif } from '@/utils/createLoadingGif';
import styles from './press-start.module.css';

export default function HomePage() {
  const [pokemonData, setPokemonData] = useState<Pokemon[]>([]);
  const [allPokemonData, setAllPokemonData] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);

  const loadAllPokemonData = useCallback(async () => {
    if (allPokemonData.length > 0) return;
    
    const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const allData = await Promise.all(
      generations.map(gen => fetchPokemonData(gen))
    );
    setAllPokemonData(allData.flat());
  }, [allPokemonData.length]);

  useEffect(() => {
    loadAllPokemonData();
  }, [loadAllPokemonData]);

  const [generation, setGeneration] = useState<number>(() => 
    storage.getNumber('pokedex-generation', 1)
  );
  
  const [isJapanese, setIsJapanese] = useState<boolean>(() => 
    storage.getBoolean('pokedex-language', false)
  );
  
  const [isShiny, setIsShiny] = useState<boolean>(() => 
    storage.getBoolean('pokedex-shiny', false)
  );
  
  const [spriteStyle, setSpriteStyle] = useState<keyof typeof spriteStyles>(() => {
    const style = storage.getString('pokedex-sprite-style', 'red-blue');
    return style as keyof typeof spriteStyles;
  });

  const [skinColor, setSkinColor] = useState(() => 
    storage.getString('pokedex-skin-color', '#8b0000')
  );
  
  const [screenColor, setScreenColor] = useState(() => 
    storage.getString('pokedex-screen-color', '#9bbc0f')
  );

  const availableStyles = useMemo(() => 
    Object.entries(spriteStyles)
      .filter(([_, { gens }]) => gens.includes(generation))
      .map(([style]) => style),
    [generation]
  );

  const spriteControlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!spriteControlsRef.current || window.innerWidth >= 768) return;

    const container = spriteControlsRef.current;
    let rafId: number;
    let lastScrollLeft = container.scrollLeft;

    const handleScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const currentScrollLeft = container.scrollLeft;
        if (Math.abs(currentScrollLeft - lastScrollLeft) > 10) {
          const width = container.clientWidth;
          const index = Math.round(currentScrollLeft / width);

          if (availableStyles[index]) {
            setSpriteStyle(availableStyles[index] as keyof typeof spriteStyles);
            lastScrollLeft = currentScrollLeft;
          }
        }
        rafId = 0;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [availableStyles, setSpriteStyle]);

  useEffect(() => {
    if (!spriteControlsRef.current || window.innerWidth >= 768) return;
    const index = availableStyles.indexOf(spriteStyle as string);
    if (index >= 0) {
      spriteControlsRef.current.scrollLeft = index * spriteControlsRef.current.clientWidth;
    }
  }, [generation, spriteStyle, availableStyles]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [spriteUrl, setSpriteUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'pokemon' | 'search' | 'settings'>('pokemon');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 3) return [];
    
    return allPokemonData.filter(pokemon => 
      isPartialMatch(searchTerm, pokemon.name) || 
      isPartialMatch(searchTerm, pokemon.japaneseName) ||
      pokemon.id.toString().includes(searchTerm)
    ).slice(0, 10);
  }, [allPokemonData, searchTerm]);

  const filteredPokemonData = useMemo(() => {
    if (!searchTerm) return pokemonData;
    return pokemonData.filter(pokemon => 
      isPartialMatch(searchTerm, pokemon.name) || 
      isPartialMatch(searchTerm, pokemon.japaneseName) ||
      pokemon.id.toString().includes(searchTerm)
    );
  }, [pokemonData, searchTerm]);

  const loadSprite = useCallback(async () => {
    if (!selectedPokemon) return;

    if (generation >= 6) {
      setSpriteUrl(isShiny ? selectedPokemon.sprites.front_shiny : selectedPokemon.sprites.front_default);
      return;
    }

    const url = await createSpriteUrl(selectedPokemon.id, spriteStyle, isShiny);
    setSpriteUrl(url);
  }, [selectedPokemon, generation, spriteStyle, isShiny]);

  useEffect(() => {
    loadSprite();
  }, [loadSprite]);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPokemonData(generation);
        setPokemonData(data);
        if (data.length > 0) {
          setSelectedPokemon(data[0]);
        }
        prefetchAllGenerations(fetchPokemonData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [generation]);

  const updateLocalStorage = useCallback(() => {
    storage.setItem('pokedex-generation', generation);
    storage.setItem('pokedex-language', isJapanese);
    storage.setItem('pokedex-shiny', isShiny);
    storage.setItem('pokedex-sprite-style', spriteStyle);
    storage.setItem('pokedex-skin-color', skinColor);
    storage.setItem('pokedex-screen-color', screenColor);

    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--pokedex-color', skinColor);
      document.documentElement.style.setProperty('--bg-screen', screenColor);
      document.documentElement.style.setProperty('--primary-color', skinColor);
    }
  }, [generation, isJapanese, isShiny, spriteStyle, skinColor, screenColor]);

  useEffect(() => {
    updateLocalStorage();
  }, [updateLocalStorage]);

  const handleGenerationChange = (gen: number) => {
    const defaultStyle = getDefaultStyleForGeneration(gen);
    setGeneration(gen);
    setSpriteStyle(defaultStyle);
    storage.setItem('pokedex-sprite-style', defaultStyle);
    setSettingsModalOpen(false);
  };

  const handleSkinColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setSkinColor(color);
  };

  const handleScreenColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setScreenColor(color);
  };

  const handleSpriteStyleChange = (style: keyof typeof spriteStyles) => {
    setSpriteStyle(style);
  };

  const handlePokemonSelect = (pokemon: Pokemon) => {
    setSelectedPokemon(pokemon);
    setSearchTerm('');
    setActiveTab('pokemon');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const getTypeClass = (type: string) => {
    return `type-${type.toLowerCase()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background-color)]">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-[var(--bg-screen)] rounded-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-[var(--text-primary)]">ロード中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pokedex">
      {/* ヘッダー */}
      <div className="pokedex-header">
        <h1 className="text-lg font-bold">ポケモン図鑑</h1>
        <button 
          onClick={() => setSettingsModalOpen(true)}
          className="p-2 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* メインコンテンツ */}
      <div className="pokedex-content">
        {activeTab === 'pokemon' && (
          <>
            {/* ポケモン表示エリア */}
            <div className="pokemon-display">
              {selectedPokemon && (
                <>
                  <div 
                    className="pokemon-sprite-container"
                    style={{ backgroundColor: screenColor }}
                  >
                    {spriteUrl && (
                      <img 
                        src={spriteUrl} 
                        alt={isJapanese ? selectedPokemon.japaneseName : selectedPokemon.name} 
                        className="pokemon-sprite"
                        style={{ transform: 'scale(2)' }}
                      />
                    )}
                  </div>
                  <div className="pokemon-info">
                    <div className="pokemon-name">
                      <span>
                        {isJapanese ? selectedPokemon.japaneseName : selectedPokemon.name}
                      </span>
                      <span className="pokemon-id">#{selectedPokemon.id}</span>
                    </div>
                    {selectedPokemon.types && (
                      <div className="pokemon-types">
                        {selectedPokemon.types.map(type => (
                          <span key={type} className={`pokemon-type ${getTypeClass(type)}`}>
                            {type}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="pokemon-description">
                      {isJapanese 
                        ? selectedPokemon.description.ja 
                        : selectedPokemon.description.en}
                    </p>
                  </div>

                  {/* スプライトコントロール */}
                  <div 
                    className="sprite-controls scrollbar-hide"
                    ref={spriteControlsRef}
                  >
                    {availableStyles.map(style => (
                      <button
                        key={style}
                        className={`sprite-button ${spriteStyle === style ? 'active' : ''}`}
                        onClick={() => handleSpriteStyleChange(style as keyof typeof spriteStyles)}
                      >
                        {spriteStyles[style as keyof typeof spriteStyles].displayName[isJapanese ? 'ja' : 'en']}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ポケモンリストエリア */}
            <div className="pokemon-list-container">
              <div className="search-box">
                <div className="search-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="search-input"
                  placeholder={isJapanese ? "ポケモンを検索" : "Search Pokémon"}
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchResults.length > 0 && (
                  <div className="search-suggestions">
                    {searchResults.map(pokemon => (
                      <div
                        key={pokemon.id}
                        className="search-suggestion-item"
                        onClick={() => handlePokemonSelect(pokemon)}
                      >
                        <img
                          src={`/images/pokemon_icons/${pokemon.id}.png`}
                          alt={pokemon.name}
                          className="pokemon-icon"
                          onError={(e) => {
                            e.currentTarget.src = `/images/pokemon_icons/0.png`;
                          }}
                        />
                        <span>{isJapanese ? pokemon.japaneseName : pokemon.name}</span>
                        <span className="text-xs text-gray-500">#{pokemon.id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pokemon-list">
                {filteredPokemonData.map(pokemon => (
                  <div
                    key={pokemon.id}
                    className={`pokemon-list-item ${selectedPokemon?.id === pokemon.id ? 'selected' : ''}`}
                    onClick={() => handlePokemonSelect(pokemon)}
                  >
                    <img
                      src={`/images/pokemon_icons/${pokemon.id}.png`}
                      alt={pokemon.name}
                      className="pokemon-icon"
                      onError={(e) => {
                        e.currentTarget.src = `/images/pokemon_icons/0.png`;
                      }}
                    />
                    <span>{isJapanese ? pokemon.japaneseName : pokemon.name}</span>
                    <span className="text-xs text-gray-500">#{pokemon.id}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'search' && (
          <div className="p-4">
            <div className="search-box">
              <div className="search-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="search-input"
                placeholder={isJapanese ? "ポケモンを検索" : "Search Pokémon"}
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus
              />
            </div>

            <div className="mt-4">
              {searchTerm.length < 3 ? (
                <div className="text-center text-gray-500 py-8">
                  {isJapanese ? "3文字以上入力してください" : "Enter at least 3 characters"}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {isJapanese ? "ポケモンが見つかりませんでした" : "No Pokémon found"}
                </div>
              ) : (
                <div>
                  {searchResults.map(pokemon => (
                    <div
                      key={pokemon.id}
                      className="pokemon-list-item"
                      onClick={() => handlePokemonSelect(pokemon)}
                    >
                      <img
                        src={`/images/pokemon_icons/${pokemon.id}.png`}
                        alt={pokemon.name}
                        className="pokemon-icon"
                        onError={(e) => {
                          e.currentTarget.src = `/images/pokemon_icons/0.png`;
                        }}
                      />
                      <span>{isJapanese ? pokemon.japaneseName : pokemon.name}</span>
                      <span className="text-xs text-gray-500">#{pokemon.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 下部ナビゲーション */}
      <div className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'pokemon' ? 'active' : ''}`}
          onClick={() => setActiveTab('pokemon')}
        >
          <div className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="nav-label">{isJapanese ? "ホーム" : "Home"}</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <div className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <span className="nav-label">{isJapanese ? "検索" : "Search"}</span>
        </button>
        <button 
          className={`nav-item ${settingsModalOpen ? 'active' : ''}`}
          onClick={() => setSettingsModalOpen(true)}
        >
          <div className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="nav-label">{isJapanese ? "設定" : "Settings"}</span>
        </button>
      </div>

      {/* 設定モーダル */}
      {settingsModalOpen && (
        <div 
          className="modal-overlay fade-in"
          onClick={() => setSettingsModalOpen(false)}
        >
          <div 
            className="modal-content slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="text-lg font-bold">{isJapanese ? "設定" : "Settings"}</h2>
              <button 
                onClick={() => setSettingsModalOpen(false)}
                className="p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="settings-group">
                <div className="settings-title">{isJapanese ? "表示設定" : "Display Settings"}</div>
                <div className="settings-item">
                  <span className="settings-label">{isJapanese ? "言語" : "Language"}</span>
                  <button 
                    className={`px-3 py-1 rounded-full text-sm ${isJapanese ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-200'}`}
                    onClick={() => setIsJapanese(true)}
                  >
                    日本語
                  </button>
                  <button 
                    className={`px-3 py-1 rounded-full text-sm ${!isJapanese ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-200'}`}
                    onClick={() => setIsJapanese(false)}
                  >
                    English
                  </button>
                </div>
                <div className="settings-item">
                  <span className="settings-label">{isJapanese ? "色違い" : "Shiny"}</span>
                  <button 
                    className={`relative inline-flex items-center h-6 rounded-full w-11 ${isShiny ? 'bg-[var(--primary-color)]' : 'bg-gray-300'}`}
                    onClick={() => setIsShiny(!isShiny)}
                  >
                    <span 
                      className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${isShiny ? 'translate-x-6' : 'translate-x-1'}`} 
                    />
                  </button>
                </div>
              </div>

              <div className="settings-group">
                <div className="settings-title">{isJapanese ? "カラー設定" : "Color Settings"}</div>
                <div className="color-control-items">
                  <div className="color-control-item">
                    <span>{isJapanese ? "テーマカラー" : "Theme Color"}</span>
                    <input
                      type="color"
                      id="skin-color"
                      value={skinColor}
                      onChange={handleSkinColorChange}
                    />
                  </div>
                  <div className="color-control-item">
                    <span>{isJapanese ? "スクリーン" : "Screen"}</span>
                    <input
                      type="color"
                      id="screen-color"
                      value={screenColor}
                      onChange={handleScreenColorChange}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-group">
                <div className="settings-title">{isJapanese ? "世代選択" : "Generation"}</div>
                <div className="generation-grid">
                  {[
                    { gen: 1, starters: [1, 4, 7] },
                    { gen: 2, starters: [152, 155, 158] },
                    { gen: 3, starters: [252, 255, 258] },
                    { gen: 4, starters: [387, 390, 393] },
                    { gen: 5, starters: [495, 498, 501] },
                    { gen: 6, starters: [650, 653, 656] },
                    { gen: 7, starters: [722, 725, 728] },
                    { gen: 8, starters: [810, 813, 816] },
                    { gen: 9, starters: [906, 909, 912] },
                  ].map(({ gen, starters }) => (
                    <button
                      key={gen}
                      className={`generation-button ${generation === gen ? 'active' : ''}`}
                      onClick={() => handleGenerationChange(gen)}
                    >
                      <span className="generation-number">{
                        gen === 1 ? 'Ⅰ' :
                        gen === 2 ? 'Ⅱ' :
                        gen === 3 ? 'Ⅲ' :
                        gen === 4 ? 'Ⅳ' :
                        gen === 5 ? 'Ⅴ' :
                        gen === 6 ? 'Ⅵ' :
                        gen === 7 ? 'Ⅶ' :
                        gen === 8 ? 'Ⅷ' : 'Ⅸ'
                      }</span>
                      <div className="starter-icons">
                        {starters.map(id => (
                          <img
                            key={id}
                            src={`/images/pokemon_icons/${id}.png`}
                            alt={`Starter ${id}`}
                            className="starter-icon"
                            onError={(e) => {
                              e.currentTarget.src = `/images/pokemon_icons/0.png`;
                            }}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
