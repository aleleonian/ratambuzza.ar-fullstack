const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const { uploadDir, upload, createThumbnail, uploadMultiple } = require('../../lib/upload');

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
    const width = 1600;
    const height = 1600;
    const quality = 80;

    try {
        const files = req.files; // ✅ Now an array

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }

        const resizedFiles = [];

        for (const file of files) {
            const resizedName = 'resized-' + file.filename;
            const resizedUrl = "/uploads/" + resizedName;

            const originalPath = path.join(uploadDir, file.filename);
            const outputPath = path.join(uploadDir, resizedName);

            await sharp(file.path)
                .resize({ width, height, fit: 'inside' })
                .jpeg({ quality })
                .toFile(outputPath);

            const thumbName = `thumb-${file.filename}`;
            const thumbnailUrl = await createThumbnail(file.path, thumbName);
            fs.unlinkSync(originalPath);
            // Store info to respond or save to DB
            resizedFiles.push({
                resized: '/uploads/resized-' + file.filename,
                thumb: '/uploads/' + thumbnailUrl
            });
            await req.db.execute(`
            INSERT INTO media (trip_id, user_id, url, thumbnail_url, width, height, type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [req.trip.id, req.session.user.id, resizedUrl, thumbnailUrl, width, height, 'image']);
        }
        // Return the public URL

        res.json({ success: true, files: resizedFiles });
    } catch (err) {
        next(err);
    }
});

router.get('/test-upload', async (req, res, next) => {
    res.render('trips/test-upload')
})

router.get('/gallery', async (req, res, next) => {
    const user = req.session.user;
    const trip = req.trip;
    const [media] = await req.db.execute(`
    SELECT 
    m.*, 
    u.handle AS uploader_name, 
    u.avatar_head_file_name AS uploader_avatar,
    GROUP_CONCAT(tags.name ORDER BY tags.name) AS tags
    FROM media m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN media_tags mt ON m.id = mt.media_id
    LEFT JOIN tags ON mt.tag_id = tags.id
    WHERE m.trip_id = 1
    GROUP BY m.id
    ORDER BY m.created_at DESC;

    `, [trip.id]);

    // what media items did the user like?
    const [likes] = await req.db.execute(
        'SELECT media_id FROM likes_media WHERE user_id = ?', [user.id]
    );

    const likedMediaIds = new Set(likes.map(l => l.media_id));

    media.forEach(item => {
        item.userLiked = likedMediaIds.has(item.id);
    });

    // what is the like count for the media files for /gallery?
    const [likeCounts] = await req.db.execute(
        'SELECT media_id, COUNT(*) AS count FROM likes_media GROUP BY media_id'
    );

    const countMap = Object.fromEntries(likeCounts.map(row => [row.media_id, row.count]));

    media.forEach(item => {
        item.likesCount = countMap[item.id] || 0;
    });

    res.render('trips/gallery', { media })
})

router.get('/gallery/page/:n', async (req, res, next) => {
    // const trip = req.trip;
    // const [media] = await req.db.execute(
    //     'SELECT * FROM media WHERE trip_id = ? ORDER BY created_at DESC',
    //     [trip.id]
    // );

    // res.render('trips/gallery', { media })
})
router.post('/gallery/:id/delete', async (req, res, next) => {

});
router.post('/gallery/:id/like', async (req, res, next) => {
    const userId = req.session.user.id;
    const mediaId = req.params.id;

    try {
        const [rows] = await req.db.execute(
            'SELECT * FROM likes_media WHERE user_id = ? AND media_id = ?',
            [userId, mediaId]
        );

        if (rows.length > 0) {
            // Already liked → remove like
            await req.db.execute(
                'DELETE FROM likes_media WHERE user_id = ? AND media_id = ?',
                [userId, mediaId]
            );
        } else {
            // Not yet liked → add like
            await req.db.execute(
                'INSERT INTO likes_media (user_id, media_id) VALUES (?, ?)',
                [userId, mediaId]
            );
        }

        // Query new like state to re-render the button
        const [[{ count }]] = await req.db.execute(
            'SELECT COUNT(*) AS count FROM likes_media WHERE media_id = ?',
            [mediaId]
        );

        const [[{ liked }]] = await req.db.execute(
            'SELECT COUNT(*) AS liked FROM likes_media WHERE user_id = ? AND media_id = ?',
            [userId, mediaId]
        );

        res.render('trips/gallery/like-button', {
            mediaId,
            liked: liked > 0,
            count,
        });
    } catch (err) {
        next(err);
    }
});

router.get('/gallery/:id/tags/edit', async (req, res, next) => {
    const mediaId = req.params.id;
    const [tagRows] = await req.db.execute(
        `SELECT t.name FROM media_tags mt
     JOIN tags t ON mt.tag_id = t.id
     WHERE mt.media_id = ?`,
        [mediaId]
    );
    const currentTags = tagRows.map(row => row.name);
    res.render('trips/gallery/tag-editor', { mediaId, currentTags });
});
// GET /trips/:slug/gallery/:id/tags
router.get('/gallery/:id/tags', async (req, res) => {
    const mediaId = req.params.id;
    const [tagRows] = await req.db.execute(
        `SELECT t.name FROM media_tags mt
     JOIN tags t ON mt.tag_id = t.id
     WHERE mt.media_id = ?`,
        [mediaId]
    );
    const currentTags = tagRows.map(row => row.name);

    res.render('trips/gallery/tag-pills', { currentTags, mediaId });
});

router.post('/gallery/:id/tags', async (req, res, next) => {

    const mediaId = req.params.id;
    const user = req.session.user;

    const [rows] = await req.db.execute('SELECT user_id from media WHERE id = ?', [mediaId]);
    const ownerId = rows[0]?.user_id;

    const isUploader = ownerId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isUploader && !isAdmin) {
        return res.status(403).send('Unauthorized');
    }

    const tagsInput = req.body.tags || '';
    const tagNames = tagsInput
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag);

    const conn = await req.db.getConnection();
    await conn.beginTransaction();

    // Delete old tags for this media
    await conn.execute('DELETE FROM media_tags WHERE media_id = ?', [mediaId]);

    for (const name of tagNames) {
        // Insert tag if it doesn't exist. 
        // We want unique values in this table
        await conn.execute('INSERT IGNORE INTO tags (name) VALUES (?)', [name]);
        const [tagRow] = await conn.execute('SELECT id FROM tags WHERE name = ?', [name]);
        const tagId = tagRow[0].id;
        await conn.execute('INSERT INTO media_tags (media_id, tag_id) VALUES (?, ?)', [mediaId, tagId]);
    }

    await conn.commit();
    conn.release();

    // Re-render editor with new tags
    console.log('tagNames->', tagNames);
    res.render('trips/gallery/tag-pills', { currentTags: tagNames, mediaId });
});



module.exports = router;
