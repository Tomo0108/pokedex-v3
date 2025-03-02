'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Pokemon } from '@/types/pokemon';
import { fetchPokemonData, spriteStyles, createSpriteUrl, getDefaultStyleForGeneration } from '@/utils/pokemon';
import { prefetchAllGenerations } from '@/utils/cache';

export default function HomePage() {
  const [pokemonData, setPokemonData] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [generation, setGeneration] = useState(1);
  const [isJapanese, setIsJapanese] = useState(false);
  const [isShiny, setIsShiny] = useState(false);
  const [spriteStyle, setSpriteStyle] = useState<keyof typeof spriteStyles>('gb');
  const [skinColor, setSkinColor] = useState('#8b0000');
  const [screenColor, setScreenColor] = useState('#9bbc0f');
  const [isLoading, setIsLoading] = useState(true);
  const [spriteUrl, setSpriteUrl] = useState<string | null>(null);

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
  }, []);

  const handleGenerationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gen = parseInt(e.target.value);
    setGeneration(gen);
    setSpriteStyle(getDefaultStyleForGeneration(gen));
    
    setIsLoading(true);
    try {
      const data = await fetchPokemonData(gen);
      setPokemonData(data);
      if (data.length > 0) {
        setSelectedPokemon(data[0]);
      }
    } catch (error) {
      console.error('Failed to load generation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkinColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setSkinColor(color);
    document.documentElement.style.setProperty('--pokedex-color', color);
  };

  const handleScreenColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setScreenColor(color);
    document.documentElement.style.setProperty('--bg-screen', color);
  };

  if (isLoading) {
    return (
      <main>
        <div className="pokedex">
          <div className="pokedex-left">
            <div className="screen-container">
              <div className="screen loading" />
            </div>
          </div>
          <div className="pokedex-right">
            <div className="pokemon-list">
              <div className="loading-item">
                <div className="loading-text" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="pokedex">
        <div className="pokedex-left">
          <div className="top-controls">
            <div className="control-group">
              <button 
                className="control-button" 
                onClick={() => setIsJapanese(!isJapanese)}
              >
                {isJapanese ? 'JPN' : 'ENG'}
              </button>
              <button 
                className="control-button" 
                onClick={() => fetchPokemonData(generation)}
                title="Reload cache"
              >
                ↻
              </button>
            </div>
            <button 
              className="control-button" 
              onClick={() => setIsShiny(!isShiny)}
            >
              {isShiny ? 'SHINY' : 'NORMAL'}
            </button>
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
            <div className="sprite-controls">
              {Object.entries(spriteStyles).map(([style, { gens }]) => {
                if (!gens.includes(generation)) return null;
                return (
                  <button
                    key={style}
                    className={`sprite-button ${spriteStyle === style ? 'active' : ''}`}
                    onClick={() => setSpriteStyle(style)}
                  >
                    {style.toUpperCase()}
                  </button>
                );
              })}
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
          <div className="color-controls">
            <label>COLOR</label>
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
          <div className="generation-select">
            <label htmlFor="generation">GENERATION</label>
            <select
              id="generation"
              value={generation}
              onChange={handleGenerationChange}
            >
              <option value="1">Ⅰ</option>
              <option value="2">Ⅱ</option>
              <option value="3">Ⅲ</option>
              <option value="4">Ⅳ</option>
              <option value="5">Ⅴ</option>
              <option value="6">Ⅵ</option>
              <option value="7">Ⅶ</option>
              <option value="8">Ⅷ</option>
              <option value="9">Ⅸ</option>
            </select>
          </div>
          <div className="pokemon-list">
            <ul className="pokemon-list-ul">
              {pokemonData.map(pokemon => (
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
