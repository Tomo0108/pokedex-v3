'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Pokemon } from '@/types/pokemon';
import { fetchPokemonData, spriteStyles, createSpriteUrl, getDefaultStyleForGeneration } from '@/utils/pokemon';
import { prefetchAllGenerations } from '@/utils/cache';
import { setStorageItem, getStorageItem } from '@/utils/storage';
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
  
  const getStringFromStorage = (key: string, defaultValue: string): string => {
    const stored = getStorageItem(key, defaultValue);
    return stored !== null && stored !== undefined ? String(stored) : defaultValue;
  };

  const [generation, setGeneration] = useState<number>(() => {
    const stored = getStringFromStorage('pokedex-generation', '1');
    return parseInt(stored, 10) || 1;
  });
  
  const [isJapanese, setIsJapanese] = useState<boolean>(() => 
    getStorageItem('pokedex-language', 'false') === 'true'
  );
  
  const [isShiny, setIsShiny] = useState<boolean>(() => 
    getStorageItem('pokedex-shiny', 'false') === 'true'
  );
  
  const [spriteStyle, setSpriteStyle] = useState<keyof typeof spriteStyles>(() => 
    getStorageItem('pokedex-sprite-style', 'red-blue') as keyof typeof spriteStyles
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

  // 世代変更時にスプライトスタイルを初期位置にスクロール
  useEffect(() => {
    if (!spriteControlsRef.current || window.innerWidth >= 768) return;
    const index = availableStyles.indexOf(spriteStyle);
    if (index >= 0) {
      spriteControlsRef.current.scrollLeft = index * spriteControlsRef.current.clientWidth;
    }
  }, [generation, spriteStyle, availableStyles]);
  
  const [skinColor, setSkinColor] = useState(() => 
    getStorageItem('pokedex-skin-color', '#8b0000')
  );
  
  const [screenColor, setScreenColor] = useState(() => 
    getStorageItem('pokedex-screen-color', '#9bbc0f')
  );
  
  const [isLoading, setIsLoading] = useState(true);
  const [spriteUrl, setSpriteUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  // 検索候補を生成
  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 3) return [];
    
    return allPokemonData.filter(pokemon => 
      isPartialMatch(searchTerm, pokemon.name) || 
      isPartialMatch(searchTerm, pokemon.japaneseName) ||
      pokemon.id.toString().includes(searchTerm)
    ).slice(0, 10);
  }, [allPokemonData, searchTerm]);

  // メインリストのフィルタリング
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

  const safeSetStorageItem = useCallback((key: string, value: string | number | boolean) => {
    setStorageItem(key, value.toString());
  }, []);

  const updateLocalStorage = useCallback(() => {
    safeSetStorageItem('pokedex-generation', generation);
    safeSetStorageItem('pokedex-language', isJapanese);
    safeSetStorageItem('pokedex-shiny', isShiny);
    safeSetStorageItem('pokedex-sprite-style', spriteStyle);
    safeSetStorageItem('pokedex-skin-color', skinColor);
    safeSetStorageItem('pokedex-screen-color', screenColor);

    // カスタムCSS変数も永続化
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--pokedex-color', skinColor);
      document.documentElement.style.setProperty('--bg-screen', screenColor);
    }
  }, [generation, isJapanese, isShiny, spriteStyle, skinColor, screenColor]);

  useEffect(() => {
    updateLocalStorage();
  }, [updateLocalStorage]);

  const handleGenerationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gen = parseInt(e.target.value, 10);
    setGeneration(gen);
    const defaultStyle = getDefaultStyleForGeneration(gen);
    setSpriteStyle(defaultStyle);
    safeSetStorageItem('pokedex-sprite-style', defaultStyle);
  };

  const handleSkinColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setSkinColor(color);
  };

  const handleScreenColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setScreenColor(color);
  };

  const [loadingGif, setLoadingGif] = useState<string | null>(null);
  const [loadingGifError, setLoadingGifError] = useState(false);

  useEffect(() => {
    const loadGif = async () => {
      if (typeof window === 'undefined') return;

      try {
        // 静的な代替画像を使用
        const loadingImage = new Image();
        loadingImage.src = '/icons/substitute.png';
        await new Promise<void>((resolve) => {
          loadingImage.onload = () => resolve();
        });
        
        // GIF生成を試みる
        const gif = await createLoadingGif();
        setLoadingGif(gif);
      } catch (error) {
        console.error('Failed to create loading GIF:', error);
        setLoadingGifError(true);
      }
    };

    loadGif();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        {loadingGif ? (
          <img src={loadingGif} alt="Loading..." className="loading-gif" />
        ) : (
          <img 
            src="/icons/substitute.png" 
            alt="Loading..." 
            className="loading-gif"
            style={{ transform: loadingGifError ? 'none' : 'scale(0.5)' }}
          />
        )}
      </div>
    );
  }

  return (
    <main>
      <div className="pokedex">
        <div className="pokedex-left">
          <div className="top-controls">
            <div className="search-box">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="search-input"
              />
              {searchTerm.length > 0 && searchResults.length > 0 && (
                <div className="search-suggestions">
                  {searchResults.map(pokemon => (
                    <div
                      key={pokemon.id}
                      className="search-suggestion-item"
                      onClick={() => {
                        setSelectedPokemon(pokemon);
                        setSearchTerm('');
                      }}
                    >
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vii/icons/${pokemon.id}.png`}
                        alt={pokemon.name}
                        className="pokemon-icon"
                        onError={(e) => {
                          e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
                        }}
                      />
                      <span>
                        #{pokemon.id.toString().padStart(4, '0')}{' '}
                        {isJapanese ? pokemon.japaneseName : pokemon.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="menu-container">
              <button 
                className="menu-button-plain"
                onClick={() => setMenuVisible(!menuVisible)}
              >
                <img 
                  src="/icons/poke-ball.png" 
                  alt="Menu"
                  className="poke-ball-icon"
                  width={32}
                  height={32}
                />
              </button>
              {menuVisible && (
                <div className="retro-menu">
                  <div className="retro-menu-section">
                    <button 
                      className="retro-menu-item" 
                      onClick={() => setIsJapanese(!isJapanese)}
                    >
                      <span>LANGUAGE</span>
                      <span>{isJapanese ? 'JPN' : 'ENG'}</span>
                    </button>
                    <button 
                      className="retro-menu-item" 
                      onClick={() => setIsShiny(!isShiny)}
                    >
                      <span>SPRITE</span>
                      <span>{isShiny ? 'SHINY' : 'NORMAL'}</span>
                    </button>
                  </div>
                  <div className="retro-menu-section">
                    <div className="retro-menu-header">COLOR</div>
                    <div className="retro-menu-content">
                      <div className="color-control-items">
                        <div className="color-control-item">
                          <span>SKIN</span>
                          <input
                            type="color"
                            id="skin-color"
                            value={skinColor}
                            onChange={handleSkinColorChange}
                          />
                        </div>
                        <div className="color-control-item">
                          <span>SCREEN</span>
                          <input
                            type="color"
                            id="screen-color"
                            value={screenColor}
                            onChange={handleScreenColorChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="retro-menu-section">
                    <div className="retro-menu-header">GENERATION</div>
                    <div className="retro-menu-content">
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
                            onClick={() => {
                              const defaultStyle = getDefaultStyleForGeneration(gen);
                              setGeneration(gen);
                              setSpriteStyle(defaultStyle);
                              safeSetStorageItem('pokedex-generation', gen);
                              safeSetStorageItem('pokedex-sprite-style', defaultStyle);
                              setMenuVisible(false);
                            }}
                          >
                            <span className={`generation-number ${styles.pressStart}`}>{
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
                                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vii/icons/${id}.png`}
                                  alt={`Starter ${id}`}
                                  className="starter-icon"
                                  onError={(e) => {
                                    e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
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
              )}
            </div>
          </div>
          <div className="screen-container">
            <div className="screen">
              {selectedPokemon && spriteUrl && (
                <img 
                  src={spriteUrl}
                  alt={selectedPokemon.name}
                  className="pokemon-sprite"
                />
              )}
            </div>
          </div>
          {generation < 6 && (
            <div className="sprite-controls-wrap">
              <div className="sprite-controls-inner">
                <div className="sprite-controls-gradient" />
                <div className="sprite-controls-gradient right" />
                <div className="sprite-controls" ref={spriteControlsRef}>
                  {Object.entries(spriteStyles).map(([style, { gens }]) => {
                    if (!gens.includes(generation)) return null;
                    return (
                      <button
                        key={style}
                        className={`sprite-button ${spriteStyle === style ? 'active' : ''}`}
                        onClick={() => setSpriteStyle(style as keyof typeof spriteStyles)}
                      >
                        {spriteStyles[style].displayName[isJapanese ? 'ja' : 'en']}
                      </button>
                    );
                  })}
                </div>
                <div className="sprite-dots">
                  {Object.entries(spriteStyles).map(([style, { gens }]) => {
                    if (!gens.includes(generation)) return null;
                    return (
                      <div 
                        key={style}
                        className={`sprite-dot ${spriteStyle === style ? 'active' : ''}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <div className="description-container">
            <div className="description-box">
              {selectedPokemon && (
                <p 
                  className="pokemon-description"
                  lang={isJapanese ? 'ja' : 'en'}
                >
                  {isJapanese 
                    ? selectedPokemon.description.ja 
                    : selectedPokemon.description.en
                  }
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="pokedex-right">
          <div className="pokemon-list">
            <ul className="pokemon-list-ul">
              {filteredPokemonData.map(pokemon => (
                <li
                  key={pokemon.id}
                  className={`pokemon-list-item ${
                    selectedPokemon?.id === pokemon.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedPokemon(pokemon)}
                >
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-vii/icons/${pokemon.id}.png`}
                    alt={pokemon.name}
                    className="pokemon-icon"
                    onError={(e) => {
                      e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
                    }}
                  />
                  <span>
                    #{pokemon.id.toString().padStart(4, '0')}{' '}
                    {isJapanese ? pokemon.japaneseName : pokemon.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
