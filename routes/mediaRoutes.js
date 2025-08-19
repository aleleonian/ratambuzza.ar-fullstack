const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const { uploadDir, upload } = require('../lib/upload');

const router = express.Router();

// use single image upload middleware
router.post('/upload', upload.single('image'), async (req, res, next) => {
    try {
        const originalPath = path.join(uploadDir, req.file.filename);
        const resizedFilename = `resized-${req.file.filename}`;
        const resizedPath = path.join(uploadDir, resizedFilename);

        // Resize the uploaded image
        await sharp(originalPath)
            .resize({ width: 1600, height: 1600, fit: 'inside' })
            .jpeg({ quality: 80 })
            .toFile(resizedPath);

        // Optionally delete the original if you don’t want it
        fs.unlinkSync(originalPath);

        // Return the public URL
        res.json({ url: `/uploads/${resizedFilename}` });

    } catch (err) {
        next(err);
    }
});

router.get('/test-upload', async (req, res, next) => {
    res.render('test-upload')
})
module.exports = router;
