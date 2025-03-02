declare module 'gif.js' {
  export interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    background?: string;
  }

  export interface GIF {
    addFrame(canvas: HTMLCanvasElement, options: { delay: number }): void;
    on(event: 'finished', callback: (blob: Blob) => void): void;
    render(): void;
  }

  const GIF: {
    new (options: GIFOptions): GIF;
  };

  export default GIF;
}
