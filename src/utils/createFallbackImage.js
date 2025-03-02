const fs = require('fs');
const { createCanvas } = require('canvas');

// 96x96ピクセルの灰色の画像を作成
const canvas = createCanvas(96, 96);
const ctx = canvas.getContext('2d');

// 背景を灰色で塗りつぶす
ctx.fillStyle = '#E0E0E0';
ctx.fillRect(0, 0, 96, 96);

// PNGとして保存
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('public/images/no-sprite.png', buffer);

console.log('Fallback image created successfully');
