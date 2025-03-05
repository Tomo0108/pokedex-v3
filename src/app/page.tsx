'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Pokemon } from '@/types/pokemon';
import { fetchPokemonData, spriteStyles, createSpriteUrl, getDefaultStyleForGeneration } from '@/utils/pokemon';
import { prefetchAllGenerations } from '@/utils/cache';
import { storage } from '@/utils/storage';
import { isPartialMatch } from '@/utils/kana';
import { createLoadingGif } from '@/utils/createLoadingGif';

// ポケモンタイプの日本語訳
const typeTranslations = {
  Normal: 'ノーマル',
  Fire: 'ほのお',
  Water: 'みず',
  Electric: 'でんき',
  Grass: 'くさ',
  Ice: 'こおり',
  Fighting: 'かくとう',
  Poison: 'どく',
  Ground: 'じめん',
  Flying: 'ひこう',
  Psychic: 'エスパー',
  Bug: 'むし',
  Rock: 'いわ',
  Ghost: 'ゴースト',
  Dragon: 'ドラゴン',
  Dark: 'あく',
  Steel: 'はがね',
  Fairy: 'フェアリー'
};

export default function HomePage() {
  const [pokemonData, setPokemonData] = useState<Pokemon[]>([]);
  const [allPokemonData, setAllPokemonData] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
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
  const [isLoading, setIsLoading] = useState(true);
  const [spriteUrl, setSpriteUrl] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [spriteModalOpen, setSpriteModalOpen] = useState(false);
  const [loadingGif, setLoadingGif] = useState<string | null>(null);
  const [loadingGifError, setLoadingGifError] = useState(false);

  useEffect(() => {
    const loadGif = async () => {
      if (typeof window === 'undefined') return;

      try {
        const loadingImage = new Image();
        loadingImage.src = '/icons/substitute.png';
        await new Promise<void>((resolve) => {
          loadingImage.onload = () => resolve();
        });
        
        const gif = await createLoadingGif();
        setLoadingGif(gif);
      } catch (error) {
        console.error('Failed to create loading GIF:', error);
        setLoadingGifError(true);
      }
    };

    loadGif();
  }, []);

  useEffect(() => {
    const setAppHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };

    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);

    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
    };
  }, []);

  useEffect(() => {
    loadAllPokemonData();
  }, []);

  const loadAllPokemonData = useCallback(async () => {
    if (allPokemonData.length > 0) return;
    
    const generations = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const allData = await Promise.all(
      generations.map(gen => fetchPokemonData(gen))
    );
    setAllPokemonData(allData.flat());
  }, [allPokemonData.length]);

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
        
        if ('serviceWorker' in navigator && window.matchMedia('(display-mode: standalone)').matches) {
          preloadImages();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [generation]);

  useEffect(() => {
    updateLocalStorage();
  }, [generation, isJapanese, isShiny, spriteStyle, skinColor, screenColor]);

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
    }
  }, [generation, isJapanese, isShiny, spriteStyle, skinColor, screenColor]);

  useEffect(() => {
    if (selectedPokemon) {
      const loadSpriteUrl = async () => {
        try {
          const url = await createSpriteUrl(selectedPokemon.id, spriteStyle, isShiny);
          setSpriteUrl(url);
        } catch (error) {
          console.error('Failed to load sprite URL:', error);
          setSpriteUrl('/images/no-sprite.png');
        }
      };
      
      loadSpriteUrl();
    }
  }, [selectedPokemon, spriteStyle, isShiny]);

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

  const preloadImages = async () => {
    console.log('プリロード開始...');
    try {
      const gen9Ids = Array.from({ length: 120 }, (_, i) => 906 + i);
      const imagePromises = gen9Ids.map(id => {
        const img = new Image();
        img.src = `/images/generation-ix/${id}.webp`;
        return new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
      });

      const shinyImagePromises = gen9Ids.map(id => {
        const img = new Image();
        img.src = `/images/generation-ix/shiny/${id}.webp`;
        return new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
      });

      const iconPromises = [
        '/icons/substitute.png',
        '/icons/poke-doll.png'
      ].map(path => {
        const img = new Image();
        img.src = path;
        return new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
      });

      await Promise.all([...imagePromises, ...shinyImagePromises, ...iconPromises]);
      console.log('プリロード完了');
    } catch (error) {
      console.error('画像プリロード中にエラーが発生しました:', error);
    }
  };

  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.error('バイブレーション機能が利用できません:', e);
      }
    }
  };

  const handleGenerationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    vibrate(15);
    const gen = parseInt(e.target.value, 10);
    const defaultStyle = getDefaultStyleForGeneration(gen);
    setGeneration(gen);
    setSpriteStyle(defaultStyle);
    storage.setItem('pokedex-sprite-style', defaultStyle);
  };

  const handleSkinColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    vibrate(15);
    setSkinColor(e.target.value);
  };

  const handleScreenColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    vibrate(15);
    setScreenColor(e.target.value);
  };

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
    <main className="flex flex-col min-h-screen">
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
                        src={pokemon.id >= 906 && pokemon.id <= 1025
                          ? `/images/generation-ix/${pokemon.id}.webp` 
                          : `/images/pokemon_icons/${pokemon.id}.webp`}
                        alt={isJapanese ? pokemon.japaneseName : pokemon.name}
                        className="pokemon-icon"
                        onError={(e) => {
                          e.currentTarget.src = `/images/no-sprite.png`;
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
          </div>
          <div className="menu-container">
            <button 
              className="menu-button-plain"
              onClick={() => setMenuVisible(!menuVisible)}
              aria-expanded={menuVisible}
              aria-label="Menu"
            >
              <img 
                src="/icons/poke-ball.png" 
                alt="Menu"
                className="poke-ball-icon"
                width={32}
                height={32}
                style={{ transform: menuVisible ? 'rotate(-15deg) scale(0.9)' : 'none' }}
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
                <div className="retro-menu-section">
                  <div className="retro-menu-header">GENERATION</div>
                  <div className="retro-menu-content">
                    <div className="generation-grid">
                      {[
                        { gen: 1, starters: [1] },
                        { gen: 2, starters: [152] },
                        { gen: 3, starters: [252] },
                        { gen: 4, starters: [387] },
                        { gen: 5, starters: [495] },
                        { gen: 6, starters: [650] },
                        { gen: 7, starters: [722] },
                        { gen: 8, starters: [810] },
                        { gen: 9, starters: [906] },
                      ].map(({ gen }) => (
                        <button
                          key={gen}
                          className={`generation-button ${generation === gen ? 'active' : ''}`}
                          onClick={() => {
                            let defaultStyle = getDefaultStyleForGeneration(gen);
                            if (!defaultStyle) {
                              defaultStyle = 'emerald';
                            }
                            setGeneration(gen);
                            setSpriteStyle(defaultStyle);
                            storage.setItem('pokedex-generation', gen);
                            storage.setItem('pokedex-sprite-style', defaultStyle);
                            setMenuVisible(false);
                          }}
                        >
                          <div className="starter-icons">
                            <img
                              src={gen === 9
                                ? `/images/generation-ix/${gen * 100 + 6}.webp`
                                : `/images/pokemon_icons/${gen * 100 + 6}.webp`}
                              alt={`Generation ${gen}`}
                              className="starter-icon"
                              onError={(e) => {
                                e.currentTarget.src = `/images/no-sprite.png`;
                              }}
                            />
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
          <div className="screen-container">
            <div className="screen">
              {selectedPokemon && (
                <div className="pokemon-sprite">
                  <img
                    src={spriteUrl || '/icons/substitute.png'}
                    alt={isJapanese ? selectedPokemon.japaneseName : selectedPokemon.name}
                    onError={(e) => {
                      e.currentTarget.src = `/images/no-sprite.png`;
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="pokemon-info">
            <h2 className="pokemon-name">
              {selectedPokemon ? (
                <>
                  <span className="pokemon-number">#{selectedPokemon.id}</span>{" "}
                  {isJapanese ? selectedPokemon.japaneseName : selectedPokemon.name}
                </>
              ) : (
                "Loading..."
              )}
            </h2>
            <div className="pokemon-types">
              {selectedPokemon?.types.map((type) => (
                <span key={type} className={`type-badge ${type.toLowerCase()}`}>
                  {isJapanese ? typeTranslations[type as keyof typeof typeTranslations] || type : type}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="pokedex-right">
          <div className="pokemon-list">
            <ul className="pokemon-list-ul">
              {filteredPokemonData.map((pokemon) => (
                <li
                  key={pokemon.id}
                  className={`pokemon-list-item ${selectedPokemon?.id === pokemon.id ? 'selected' : ''}`}
                  onClick={() => {
                    vibrate(20);
                    setSelectedPokemon(pokemon);
                  }}
                >
                  <img
                    src={pokemon.id >= 906 && pokemon.id <= 1025
                      ? `/images/generation-ix/${pokemon.id}.webp` 
                      : `/images/pokemon_icons/${pokemon.id}.webp`}
                    alt={isJapanese ? pokemon.japaneseName : pokemon.name}
                    className="pokemon-icon"
                    onError={(e) => {
                      e.currentTarget.src = `/images/no-sprite.png`;
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
