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
      // スプライトコントロール内のタッチイベントのみを処理
      if (e.currentTarget === container) {
        isDragging = true;
        startX = e.touches[0].pageX;
        startScrollLeft = container.scrollLeft;
        container.classList.add('grabbing');
        setShowSwipeHint(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      // スプライトコントロール内のタッチイベントのみを処理
      if (e.currentTarget === container) {
        const x = e.touches[0].pageX;
        const walk = (x - startX) * 1.5;
        container.scrollLeft = startScrollLeft - walk;
        
        // スクロール位置に基づいてスプライトスタイルを更新
        const width = container.clientWidth;
        const index = Math.round(container.scrollLeft / width);
        if (availableStyles[index] && availableStyles[index] !== spriteStyle) {
          setSpriteStyle(availableStyles[index] as keyof typeof spriteStyles);
        }
        
        // スプライトコントロール内のスクロールのみを防止
        e.preventDefault();
      }
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
  const [spriteUrl, setSpriteUrl] = useState<string>('');
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

  useEffect(() => {
    if (selectedPokemon) {
      const loadSpriteUrl = async () => {
        try {
          const url = await createSpriteUrl(selectedPokemon.id, spriteStyle, isShiny);
          setSpriteUrl(url);
        } catch (error) {
          console.error('Failed to load sprite URL:', error);
          setSpriteUrl('/icons/substitute.png');
        }
      };
      
      loadSpriteUrl();
    }
  }, [selectedPokemon, spriteStyle, isShiny]);

  useEffect(() => {
    if (selectedPokemon) {
      const updateSpriteUrl = async () => {
        try {
          const url = await createSpriteUrl(selectedPokemon.id, spriteStyle, isShiny);
          setSpriteUrl(url);
        } catch (error) {
          console.error('Failed to update sprite URL:', error);
          setSpriteUrl('/icons/substitute.png');
        }
      };
      
      updateSpriteUrl();
    }
  }, [spriteStyle, isShiny]);

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
        
        // PWAインストール時に画像をプリロード
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

  // 画像をプリロードする関数
  const preloadImages = async () => {
    console.log('プリロード開始...');
    try {
      // 9世代のポケモン画像をプリロード
      const gen9Ids = Array.from({ length: 120 }, (_, i) => 906 + i);
      const imagePromises = gen9Ids.map(id => {
        const img = new Image();
        img.src = `/images/generation-ix/${id}.png`;
        return new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
      });

      // シャイニー画像もプリロード
      const shinyImagePromises = gen9Ids.map(id => {
        const img = new Image();
        img.src = `/images/generation-ix/shiny/${id}.png`;
        return new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
      });

      // アイコン画像をプリロード
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
    vibrate(15); // 短い振動
    const gen = parseInt(e.target.value, 10);
    const defaultStyle = getDefaultStyleForGeneration(gen);
    setGeneration(gen);
    setSpriteStyle(defaultStyle);
    storage.setItem('pokedex-sprite-style', defaultStyle);
  };

  const handleSkinColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    vibrate(15); // 短い振動
    setSkinColor(e.target.value);
  };

  const handleScreenColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    vibrate(15); // 短い振動
    setScreenColor(e.target.value);
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

  // 御三家ポケモンの表示を修正
  const getGenerationStarters = (gen: number) => {
    // 各世代の御三家ポケモンの初期・進化形（ID）
    const starterEvolutions = {
      1: [
        [1, 2, 3],     // フシギダネ、フシギソウ、フシギバナ
        [4, 5, 6],     // ヒトカゲ、リザード、リザードン
        [7, 8, 9]      // ゼニガメ、カメール、カメックス
      ],
      2: [
        [152, 153, 154], // チコリータ、ベイリーフ、メガニウム
        [155, 156, 157], // ヒノアラシ、マグマラシ、バクフーン
        [158, 159, 160]  // ワニノコ、アリゲイツ、オーダイル
      ],
      3: [
        [252, 253, 254], // キモリ、ジュプトル、ジュカイン
        [255, 256, 257], // アチャモ、ワカシャモ、バシャーモ
        [258, 259, 260]  // ミズゴロウ、ヌマクロー、ラグラージ
      ],
      4: [
        [387, 388, 389], // ナエトル、ハヤシガメ、ドダイトス
        [390, 391, 392], // ヒコザル、モウカザル、ゴウカザル
        [393, 394, 395]  // ポッチャマ、ポッタイシ、エンペルト
      ],
      5: [
        [495, 496, 497], // ツタージャ、ジャノビー、ジャローダ
        [498, 499, 500], // ポカブ、チャオブー、エンブオー
        [501, 502, 503]  // ミジュマル、フタチマル、ダイケンキ
      ],
      6: [
        [650, 651, 652], // ハリマロン、ハリボーグ、ブリガロン
        [653, 654, 655], // フォッコ、テールナー、マフォクシー
        [656, 657, 658]  // ケロマツ、ゲコガシラ、ゲッコウガ
      ],
      7: [
        [722, 723, 724], // モクロー、フクスロー、ジュナイパー
        [725, 726, 727], // ニャビー、ニャヒート、ガオガエン
        [728, 729, 730]  // アシマリ、オシャマリ、アシレーヌ
      ],
      8: [
        [810, 811, 812], // サルノリ、バータップ、ゴリランダー
        [813, 814, 815], // ヒバニー、ラビフット、エースバーン
        [816, 817, 818]  // メッソン、ジメレオン、インテレオン
      ],
      9: [
        [906, 907, 908], // ニャオハ、モウカ、マスカーニャ
        [909, 910, 911], // ホゲータ、グワッス、ラウドボーン
        [912, 913, 914]  // クワッス、ウェルカモ、ウェーニバル
      ]
    };
    
    // 該当世代の御三家をランダムに1つ選択
    const starters = starterEvolutions[gen as keyof typeof starterEvolutions];
    const randomStarterIndex = Math.floor(Math.random() * starters.length);
    const selectedStarter = starters[randomStarterIndex];
    
    // 選択した御三家の進化段階をランダムに選択
    const randomEvoIndex = Math.floor(Math.random() * selectedStarter.length);
    const pokemonId = selectedStarter[randomEvoIndex];
    
    // 9世代の場合は特別なパスを使用
    const imagePath = gen === 9 
      ? `/sprites/pokemon/versions/generation-ix/${pokemonId}.png`
      : `/images/pokemon_icons/${pokemonId}.png`;
    
    return (
      <img 
        key={pokemonId}
        src={imagePath}
        alt={`Starter ${pokemonId}`}
        className="starter-icon"
        onError={(e) => {
          e.currentTarget.src = `/icons/substitute.png`;
        }}
      />
    );
  };

  // スプライトコントロール関連のステートを追加
  const [spriteModalOpen, setSpriteModalOpen] = useState(false);

  // バイブレーション機能
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.error('バイブレーション機能が利用できません:', e);
      }
    }
  };

  // スプライトモーダルを開く関数
  const openSpriteModal = () => {
    vibrate(10); // 短い振動
    setSpriteModalOpen(true);
  };

  // スプライトモーダルを閉じる関数
  const closeSpriteModal = () => {
    vibrate(10); // 短い振動
    setSpriteModalOpen(false);
  };

  // スプライトスタイルを選択する関数
  const selectSpriteStyle = (style: keyof typeof spriteStyles) => {
    vibrate([10, 30, 10]); // パターン振動（短い-長い-短い）
    setSpriteStyle(style);
    closeSpriteModal();
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
                        src={pokemon.id > 905 
                          ? `/sprites/pokemon/versions/generation-ix/${pokemon.id}.png` 
                          : `/images/pokemon_icons/${pokemon.id}.png`}
                        alt={isJapanese ? pokemon.japaneseName : pokemon.name}
                        className="pokemon-icon"
                        onError={(e) => {
                          e.currentTarget.src = `/icons/substitute.png`;
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
              {selectedPokemon && (
                <div className="pokemon-sprite">
                  <img
                    src={spriteUrl || '/icons/substitute.png'}
                    alt={isJapanese ? selectedPokemon.japaneseName : selectedPokemon.name}
                    onError={(e) => {
                      // 画像が見つからない場合は代替画像を表示
                      e.currentTarget.src = `/icons/substitute.png`;
                    }}
                  />
                </div>
              )}
            </div>
            <div className="sprite-controls-container">
              {/* スプライトスタイル選択ボタン */}
              {generation <= 5 && (
                <button className="sprite-select-button" onClick={openSpriteModal}>
                  {spriteStyles[spriteStyle].displayName[isJapanese ? 'ja' : 'en']} <span className="arrow-down">▼</span>
                </button>
              )}
              
              {/* スプライトスタイル選択モーダル */}
              {spriteModalOpen && generation <= 5 && (
                <div className="sprite-modal-overlay" onClick={closeSpriteModal}>
                  <div className="sprite-modal" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: skinColor }}>
                    <div className="sprite-modal-header">
                      <h3>{isJapanese ? "シリーズ" : "SERIES"}</h3>
                      <button className="close-button" onClick={closeSpriteModal}>×</button>
                    </div>
                    <div className="sprite-modal-content">
                      {availableStyles.map((style) => (
                        <button
                          key={style}
                          className={`sprite-modal-button ${style === spriteStyle ? 'active' : ''}`}
                          onClick={() => selectSpriteStyle(style as keyof typeof spriteStyles)}
                        >
                          {spriteStyles[style as keyof typeof spriteStyles].displayName[isJapanese ? 'ja' : 'en']}
                        </button>
                      ))}
                    </div>
                  </div>
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
              {filteredPokemonData.map((pokemon) => (
                <li
                  key={pokemon.id}
                  className={`pokemon-list-item ${selectedPokemon?.id === pokemon.id ? 'selected' : ''}`}
                  onClick={() => {
                    vibrate(20); // 中程度の振動
                    setSelectedPokemon(pokemon);
                  }}
                >
                  <img
                    src={pokemon.id > 905 
                      ? `/sprites/pokemon/versions/generation-ix/${pokemon.id}.png` 
                      : `/images/pokemon_icons/${pokemon.id}.png`}
                    alt={isJapanese ? pokemon.japaneseName : pokemon.name}
                    className="pokemon-icon"
                    onError={(e) => {
                      e.currentTarget.src = `/icons/substitute.png`;
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