'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Pokemon } from '@/types/pokemon';
import { fetchPokemonData, spriteStyles, createSpriteUrl, getDefaultStyleForGeneration } from '@/utils/pokemon';
import { prefetchAllGenerations } from '@/utils/cache';
import { storage, StorageValue } from '@/utils/storage';
import { isPartialMatch } from '@/utils/kana';
import { createLoadingGif } from '@/utils/createLoadingGif';
import styles from './press-start.module.css';

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

  useEffect(() => {
    // モバイルブラウザでの100vhの問題を解決するための関数
    const setAppHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };

    // 初期設定と画面回転やリサイズ時に高さを更新
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
    if (!spriteControlsRef.current || !isMobile) return;

    const container = spriteControlsRef.current;
    let rafId: number;
    let startX: number;
    let startScrollLeft: number;
    let isDragging = false;
    let lastScrollLeft = container.scrollLeft;

    const handleScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const currentScrollLeft = container.scrollLeft;
        if (Math.abs(currentScrollLeft - lastScrollLeft) > 5) {
          setShowSwipeHint(false);
          const width = container.clientWidth;
          const index = Math.round(currentScrollLeft / width);

          if (availableStyles[index] && availableStyles[index] !== spriteStyle) {
            setSpriteStyle(availableStyles[index] as keyof typeof spriteStyles);
          }
          lastScrollLeft = currentScrollLeft;
        }
        rafId = 0;
      });
    };

    const handleTouchStart = (e: TouchEvent) => {
      isDragging = true;
      startX = e.touches[0].pageX;
      startScrollLeft = container.scrollLeft;
      container.classList.add('grabbing');
      setShowSwipeHint(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const x = e.touches[0].pageX;
      const walk = (x - startX) * 1.5;
      container.scrollLeft = startScrollLeft - walk;
      
      // スクロール位置に基づいてスプライトスタイルを更新
      const width = container.clientWidth;
      const index = Math.round(container.scrollLeft / width);
      if (availableStyles[index] && availableStyles[index] !== spriteStyle) {
        setSpriteStyle(availableStyles[index] as keyof typeof spriteStyles);
      }
      
      // タッチ移動中はデフォルトのスクロール動作を防止
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      isDragging = false;
      container.classList.remove('grabbing');
      
      // スナップ位置に合わせる
      const width = container.clientWidth;
      const index = Math.round(container.scrollLeft / width);
      container.scrollTo({
        left: index * width,
        behavior: 'smooth'
      });
      
      if (availableStyles[index]) {
        setSpriteStyle(availableStyles[index] as keyof typeof spriteStyles);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [availableStyles, setSpriteStyle, spriteStyle, isMobile]);

  useEffect(() => {
    if (!spriteControlsRef.current || !isMobile) return;
    const index = availableStyles.indexOf(spriteStyle as string);
    if (index >= 0) {
      spriteControlsRef.current.scrollLeft = index * spriteControlsRef.current.clientWidth;
    }
  }, [generation, spriteStyle, availableStyles, isMobile]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [spriteUrl, setSpriteUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

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
    }
  }, [generation, isJapanese, isShiny, spriteStyle, skinColor, screenColor]);

  useEffect(() => {
    updateLocalStorage();
  }, [updateLocalStorage]);

const handleGenerationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gen = parseInt(e.target.value, 10);
    const defaultStyle = getDefaultStyleForGeneration(gen);
    setGeneration(gen);
    setSpriteStyle(defaultStyle);
    storage.setItem('pokedex-sprite-style', defaultStyle);
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

  // メニューを閉じる関数
  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  // メニュー外クリックで閉じる
  useEffect(() => {
    if (!menuVisible) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.retro-menu') && !target.closest('.menu-button-plain')) {
        closeMenu();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuVisible, closeMenu]);

  // 9世代のアイコンを通常のドットイラストと同じものを使用
  const getGenerationStarters = (gen: number) => {
    if (gen === 9) {
      // 9世代は通常のドットイラストを使用
      return [
        { id: 906, name: 'Sprigatito' },
        { id: 909, name: 'Fuecoco' },
        { id: 912, name: 'Quaxly' }
      ].map(starter => (
        <img 
          key={starter.id}
          src={`/sprites/pokemon/versions/generation-viii/icons/${starter.id}.png`}
          alt={starter.name}
          className="starter-icon"
        />
      ));
    }
    
    // 他の世代は既存のコード
    const starters = [
      [], // 0番目は使用しない
      [1, 4, 7], // 第1世代
      [152, 155, 158], // 第2世代
      [252, 255, 258], // 第3世代
      [387, 390, 393], // 第4世代
      [495, 498, 501], // 第5世代
      [650, 653, 656], // 第6世代
      [722, 725, 728], // 第7世代
      [810, 813, 816], // 第8世代
      [906, 909, 912], // 第9世代
    ][gen];
    
    return starters.map(id => (
      <img 
        key={id}
        src={`/sprites/pokemon/versions/generation-viii/icons/${id}.png`}
        alt={`Starter ${id}`}
        className="starter-icon"
        onError={(e) => {
          e.currentTarget.src = `/images/no-sprite.png`;
        }}
      />
    ));
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
                        src={`/images/pokemon_icons/${pokemon.id}.png`}
                        alt={pokemon.name}
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
                      onClick={() => {
                        setIsJapanese(!isJapanese);
                        // メニュー項目クリック時にメニューを閉じない
                      }}
                    >
                      <span>LANGUAGE</span>
                      <span>{isJapanese ? 'JPN' : 'ENG'}</span>
                    </button>
                    <button 
                      className="retro-menu-item" 
                      onClick={() => {
                        setIsShiny(!isShiny);
                        // メニュー項目クリック時にメニューを閉じない
                      }}
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
                              let defaultStyle = getDefaultStyleForGeneration(gen);
                              if (!defaultStyle) {
                                defaultStyle = 'red-blue';
                              }
                              setGeneration(gen);
                              setSpriteStyle(defaultStyle);
                              storage.setItem('pokedex-generation', gen);
                              storage.setItem('pokedex-sprite-style', defaultStyle);
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
                              {getGenerationStarters(gen)}
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
                {isMobile && showSwipeHint && (
                  <div className="swipe-hint">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                      <path d="M14 5l-5 5 5 5V5z"/>
                      <path d="M10 5l-5 5 5 5V5z"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}
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
                <span
                  key={type}
                  className={`type-badge ${type.toLowerCase()}`}
                >
                  {isJapanese ? typeTranslations[type as keyof typeof typeTranslations] || type : type}
                </span>
              ))}
            </div>
            
            <div className="pokemon-description">
              {selectedPokemon ? (
                <>
                  {isJapanese && selectedPokemon.description?.ja ? (
                    <p lang="ja">{selectedPokemon.description.ja}</p>
                  ) : selectedPokemon.description?.en ? (
                    <p lang="en">{selectedPokemon.description.en}</p>
                  ) : (
                    <p lang={isJapanese ? "ja" : "en"}>{isJapanese ? "説明文がありません" : "No description available"}</p>
                  )}
                </>
              ) : (
                <p lang={isJapanese ? "ja" : "en"}>{isJapanese ? "読み込み中..." : "Loading..."}</p>
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
                    src={`/images/pokemon_icons/${pokemon.id}.png`}
                    alt={pokemon.name}
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
