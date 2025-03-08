export type PokemonType = 
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic'
  | 'bug' | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export type PokemonDescription = {
  en: string;
  ja: string;
};

export type Pokemon = {
  id: number;
  name: string;
  japaneseName: string;
  types: PokemonType[];
  descriptions: {
    [key: number]: PokemonDescription;
  };
  sprites?: {
    front_default: string;
    front_shiny: string;
  };
  description?: PokemonDescription;
  form?: string;
};

export type SpriteStyle = {
  path: string;
  gens: number[];
  animated: boolean;
  displayName: {
    ja: string;
    en: string;
  };
};

export type SpriteStyles = {
  [key: string]: SpriteStyle;
};

export type TypeTranslations = {
  [key in PokemonType]: string;
};

export type TypeColors = {
  [key in PokemonType]: string;
};
