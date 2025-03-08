const SPRITE_STYLE_KEY = 'sprite-style';
const SHINY_KEY = 'shiny';

export function useStorage() {
  const getSpriteStyle = (): string => {
    if (typeof window === 'undefined') return 'black-white';
    return localStorage.getItem(SPRITE_STYLE_KEY) || 'black-white';
  };

  const setSpriteStyle = (style: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SPRITE_STYLE_KEY, style);
  };

  const getShiny = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SHINY_KEY) === 'true';
  };

  const setShiny = (isShiny: boolean): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SHINY_KEY, isShiny.toString());
  };

  return {
    getSpriteStyle,
    setSpriteStyle,
    getShiny,
    setShiny,
  };
}
