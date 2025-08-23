const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

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
    .resize({ width: 400 }) // you can adjust size
    .jpeg({ quality: 60 })
    .toFile(thumbPath);
  return `/uploads/${destName}`;
};

module.exports = {
  uploadDir,
  upload: multer({ storage }),
  createThumbnail,
  uploadMultiple: multer({ storage }).array('media', 10),
};
