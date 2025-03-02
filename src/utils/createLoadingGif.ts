import GIF from 'gif.js';

export async function createLoadingGif(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('This function must be run in browser environment');
  }

  // GIFエンコーダーの設定
  const gif = new GIF({
    workers: 4,          // ワーカー数を増やして処理を高速化
    quality: 0,          // 品質を最高に（0が最高品質）
    width: 320,
    height: 320,
    background: '#9bbc0f'
  });

  // Canvas要素の作成
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // カービン画像の読み込み
  const substituteImage = new Image();
  substituteImage.src = '/icons/substitute.png';

  await new Promise<void>((resolve) => {
    substituteImage.onload = () => resolve();
  });

  // サイズと間隔の計算（96は320の約1/3）
  const size = 96;  // カービンのサイズ
  const spacing = 16;  // 固定間隔
  const yPos = 148;  // 垂直位置（上寄り）
  const leftX = Math.round((320 - (size * 3 + spacing * 2)) / 2);  // 左端開始位置

  // 3つの位置を計算（等間隔配置）
  const positions = [
    { x: leftX, y: yPos },                          // 左
    { x: leftX + size + spacing, y: yPos },         // 中央
    { x: leftX + (size + spacing) * 2, y: yPos }    // 右
  ];

  // フレーム生成
  for (let position = 0; position < 3; position++) {
    // 背景を描画
    ctx.fillStyle = '#9bbc0f';
    ctx.fillRect(0, 0, 320, 320);

    // カービンを描画
    const pos = positions[position];
    ctx.drawImage(substituteImage, pos.x, pos.y, size, size);

    // メインフレーム（950ms）とつなぎフレーム（50ms）を追加
    gif.addFrame(canvas, { delay: 950 });  // メインフレーム
    gif.addFrame(canvas, { delay: 50 });   // つなぎフレーム
  }

  // GIFの生成
  return new Promise<string>((resolve) => {
    gif.on('finished', blob => {
      resolve(URL.createObjectURL(blob));
    });
    gif.render();
  });
}
