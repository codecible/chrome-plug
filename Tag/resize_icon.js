const sharp = require('sharp');
const path = require('path');

const sizes = [16, 32, 48, 128];
const sourceIcon = path.join(__dirname, 'icons', 'tag.png');

async function resizeIcons() {
  for (const size of sizes) {
    await sharp(sourceIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(__dirname, 'icons', `tag${size}.png`));
  }
  console.log('图标调整完成！');
}

resizeIcons().catch(console.error); 