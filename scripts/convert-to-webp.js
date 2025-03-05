import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function convertToWebP(filePath) {
    try {
        if (path.extname(filePath).toLowerCase() !== '.png') {
            return;
        }

        const webpPath = filePath.replace('.png', '.webp');
        await sharp(filePath)
            .webp({ quality: 100, lossless: true }) // 透過を保持
            .toFile(webpPath);

        // 成功したら元のPNGを削除
        await fs.unlink(filePath);
        console.log(`Converted and removed: ${filePath}`);
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
    }
}

async function processDirectory(directory) {
    try {
        const entries = await fs.readdir(directory, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                await processDirectory(fullPath);
            } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.png') {
                await convertToWebP(fullPath);
            }
        }
    } catch (error) {
        console.error(`Error processing directory ${directory}:`, error);
    }
}

// メイン処理
async function main() {
    const imagesDir = path.join(process.cwd(), 'public/images');
    await processDirectory(imagesDir);
    console.log('Conversion completed');
}

main().catch(console.error);
