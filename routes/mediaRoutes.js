const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const { uploadDir, upload, createThumbnail, uploadMultiple } = require('../lib/upload');

const router = express.Router();

// use single image upload middleware
// After upload.single('image') runs you get:
// req.file: containing the uploaded file's info:
// {
//   fieldname: 'image',
//   originalname: 'cat.png',
//   encoding: '7bit',
//   mimetype: 'image/png',
//   destination: '/your/path/public/uploads',
//   filename: '1692473123123-123456.png',
//   path: '/your/path/public/uploads/1692473123123-123456.png',
//   size: 84123
// }

// router.post('/upload', upload.single('image'), async (req, res, next) => {
router.post('/upload', uploadMultiple, async (req, res, next) => {
    try {
        const files = req.files; // ✅ Now an array

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }

        const resizedFiles = [];

        for (const file of files) {
            const originalPath = path.join(uploadDir, file.filename);
            const outputPath = path.join(uploadDir, 'resized-' + file.filename);

            await sharp(file.path)
                .resize({ width: 1600, height: 1600, fit: 'inside' })
                .jpeg({ quality: 80 })
                .toFile(outputPath);

            const thumbName = `thumb-${file.filename}`;
            const thumbnailUrl = await createThumbnail(file.path, thumbName);
            fs.unlinkSync(originalPath);
            // Store info to respond or save to DB
            resizedFiles.push({
                resized: '/uploads/resized-' + file.filename,
                thumb: '/uploads/' + thumbnailUrl
            });
        }
        // const originalPath = path.join(uploadDir, req.file.filename);
        // const resizedFilename = `resized-${req.file.filename}`;
        // const resizedPath = path.join(uploadDir, resizedFilename);

        // const thumbName = `thumb-${req.file.filename}`;
        // const thumbnailUrl = await createThumbnail(req.file.path, thumbName);

        // // Resize the uploaded image
        // await sharp(originalPath)
        //     .resize({ width: 1600, height: 1600, fit: 'inside' })
        //     .jpeg({ quality: 80 })
        //     .toFile(resizedPath);

        // // Optionally delete the original if you don’t want it
        // fs.unlinkSync(originalPath);

        // Return the public URL
        res.json({ success: true, files: resizedFiles });
    } catch (err) {
        next(err);
    }
});

router.get('/test-upload', async (req, res, next) => {
    res.render('test-upload')
})
module.exports = router;
