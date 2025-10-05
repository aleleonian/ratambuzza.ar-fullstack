const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const inputDir = path.join(__dirname, '../public/images/avatars/heads');
const outputDir = path.join(__dirname, '../public/images/avatars/thumbs');

async function generateThumbs() {
  await fs.mkdir(outputDir, { recursive: true });
  const files = await fs.readdir(inputDir);

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);

    try {
      await sharp(inputPath)
        .rotate()
        .resize(80, 80)
        .toFile(outputPath);
      console.log(`✓ Created: ${outputPath}`);
    } catch (err) {
      console.error(`✗ Error with ${file}:`, err.message);
    }
  }
}

generateThumbs();
