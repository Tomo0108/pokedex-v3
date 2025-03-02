import GIF from 'gif.js';

export async function createLoadingGif(): Promise<string> {
  // GIFエンコーダーの設定
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: 256,  // GIFの幅
    height: 256, // GIFの高さ
    background: '#9bbc0f' // 薄い黄緑色の背景
  });

  // Canvas要素の作成
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // カービン画像の読み込み
  const substituteImage = new Image();
  substituteImage.src = '/icons/substitute.png';

  await new Promise((resolve) => {
    substituteImage.onload = resolve;
  });

  // 3つのカービンの位置を定義
  const positions = [
    { x: 96, y: 96 },   // 左
    { x: 128, y: 96 },  // 中央
    { x: 160, y: 96 }   // 右
  ];

  // フレームの生成（30FPS × 3秒 = 90フレーム）
  for (let frame = 0; frame < 90; frame++) {
    // 背景を描画
    ctx.fillStyle = '#9bbc0f';
    ctx.fillRect(0, 0, 256, 256);

    // 現在の時間（0-3秒）
    const time = (frame / 30) % 3;

    // 各カービンの不透明度を計算
    positions.forEach((pos, index) => {
      let opacity = 0;
      
      // 各カービンの表示タイミングを設定
      if (index === 0) {
        opacity = time < 1 ? 1 : 0;
      } else if (index === 1) {
        opacity = time >= 1 && time < 2 ? 1 : 0;
      } else {
        opacity = time >= 2 ? 1 : 0;
      }

      // カービンを描画
      if (opacity > 0) {
        ctx.globalAlpha = opacity;
        ctx.drawImage(substituteImage, pos.x, pos.y, 64, 64);
      }
    });

    ctx.globalAlpha = 1;
    
    // フレームをGIFに追加
    gif.addFrame(canvas, { delay: 1000 / 30 }); // 30FPS
  }

  // GIFの生成
  return new Promise<string>((resolve) => {
    gif.on('finished', blob => {
      resolve(URL.createObjectURL(blob));
    });
    gif.render();
  });
}
