export interface Pokemon {
  id: number;
  name: string;
  japaneseName: string;
  types: string[];
  form?: string;
  sprites: {
    front_default: string;
    front_shiny: string;
  };
  description: {
    en: string;
    ja: string;
  };
  descriptions?: {
    [key: number]: {
      en: string;
      ja: string;
    }
  };
}

export interface SpriteStyle {
  path: string;
  gens: number[];
  shiny?: boolean;
  animated?: boolean;
  displayName: {
    ja: string;
    en: string;
  };
}

export interface SpriteStyles {
  [key: string]: SpriteStyle;
}
