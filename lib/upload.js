const multer = require('multer');
const path = require('path');
const fsPromises = require('fs/promises');
const fs = require('fs');
const sharp = require('sharp');
const { imageSize } = require('image-size');

async function getImageSize(path) {
  try {
    const buffer = await fsPromises.readFile(path);
    const dimensions = imageSize(buffer); // ← works with buffer
    return dimensions;
  } catch (err) {
    console.error('❌ Failed to read image size for:', path, '\n', err);
    return { width: 0, height: 0 };
  }
}

const uploadDir = path.join(__dirname, '../public/uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

const createThumbnail = async (sourcePath, destName) => {
  const thumbPath = path.join(uploadDir, destName);
  await sharp(sourcePath)
    .rotate()
    .resize({ width: 400 }) // you can adjust size
    .jpeg({ quality: 60 })
    .toFile(thumbPath);
  return `/uploads/${destName}`;
};

module.exports = {
  uploadDir,
  upload: multer({ storage }),
  createThumbnail,
  uploadMultiple: multer({ storage }).array('media', 5),
  getImageSize
};
