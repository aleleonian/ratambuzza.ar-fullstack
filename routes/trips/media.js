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
    GROUP_CONCAT(tags.name ORDER BY tags.name) AS tags,
    m.user_id = ? AS isOwner,
    MAX(lm.user_id IS NOT NULL) AS userLiked, -- using MAX(lm.user_id IS NOT NULL) instead of lm.user_id IS NOT NULL, which satisfies strict SQL mode.
    (SELECT COUNT(*) FROM likes_media WHERE media_id = m.id) AS likesCount
    FROM media m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN likes_media lm ON lm.media_id = m.id AND lm.user_id = ? 
    LEFT JOIN media_tags mt ON m.id = mt.media_id
    LEFT JOIN tags ON mt.tag_id = tags.id
    WHERE m.trip_id = ?
    GROUP BY m.id
    ORDER BY m.created_at DESC;
`, [user.id, user.id, trip.id]);


    // TODO deprecated
    // what media items did the user like?
    // const [likes] = await req.db.execute(
    //     'SELECT media_id FROM likes_media WHERE user_id = ?', [user.id]
    // );

    // const likedMediaIds = new Set(likes.map(l => l.media_id));
    // media.forEach(item => {
    //     item.userLiked = likedMediaIds.has(item.id);
    // });

    // what is the like count for the media files for /gallery?
    // const [likeCounts] = await req.db.execute(
    //     'SELECT media_id, COUNT(*) AS count FROM likes_media GROUP BY media_id'
    // );

    // const countMap = Object.fromEntries(likeCounts.map(row => [row.media_id, row.count]));

    // media.forEach(item => {
    //     item.likesCount = countMap[item.id] || 0;
    // });

    console.log('media->', media);
    res.render('trips/gallery', { media })
})

router.get('/gallery/page/:n', async (req, res, next) => {
})

// delete an item in the gallery
router.delete('/gallery/:id/delete', async (req, res, next) => {
    const user = req.session.user;
    const mediaId = req.params.id;
    // is the user the owner of this resource?
    if (!isAuthorized(req.db, user.role, user.id, mediaId)) {
        return res.status(403).send('Unauthorized');
    }
    // if so:
    // delete from likes_media if any
    try {
        await req.db.execute(
            'DELETE FROM likes_media WHERE media_id = ?',
            [mediaId]
        );
        await req.db.execute(
            'DELETE FROM media_tags WHERE media_id = ?',
            [mediaId]
        );
        // get the filenames before deleting the entry in 'media'
        const [[media]] = await req.db.execute('SELECT url, thumbnail_url FROM media WHERE id = ?', [mediaId]);
        const uploadPath = path.join('public', media.url);
        const thumbPath = path.join('public', media.thumbnail_url);

        // delete from media
        await req.db.execute(
            'DELETE FROM media WHERE id = ?',
            [mediaId]
        );
        // delete from /uploads
        if (fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        res.setHeader('X-Toast', 'Item eliminado!');
        res.setHeader('X-Toast-Type', 'success');
        return res.status(200).send('');
    }
    catch (error) {
        console.log("Error deleting media: " + error);
        res.setHeader('X-Toast', 'No se pudo eliminar!');
        res.setHeader('X-Toast-Type', 'error');
        return res.status(500).send('Internal Server Error:' + error);
    }

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

        res.render('trips/gallery/like-button-gallery', {
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
    res.setHeader('X-Toast', 'Tags actualizados!');
    res.setHeader('X-Toast-Type', 'success');
    res.render('trips/gallery/tag-pills', { currentTags: tagNames, mediaId });
});

router.get('/gallery/:id/lightbox-data', async (req, res) => {
    const user = req.session.user;
    const mediaId = req.params.id;
    const userId = user.id;

    try {
        //Get full metadata for a specific media item, including uploader info, 
        // tags, like status for a specific user, and total like count.
        const [[media]] = await req.db.execute(`
        SELECT m.*, u.handle AS uploader_name, u.avatar_head_file_name AS uploader_avatar,
        m.user_id = ? AS isOwner,
        GROUP_CONCAT(tags.name ORDER BY tags.name) AS tags,
        EXISTS (
        SELECT 1 FROM likes_media WHERE user_id = ? AND media_id = m.id
        ) AS userLiked,
        (SELECT COUNT(*) FROM likes_media WHERE media_id = m.id) AS likesCount
        FROM media m
        JOIN users u ON m.user_id = u.id
        LEFT JOIN media_tags mt ON m.id = mt.media_id
        LEFT JOIN tags ON mt.tag_id = tags.id
        WHERE m.id = ?
        GROUP BY m.id
    `, [userId, userId, mediaId]);

        if (!media) return res.status(404).send('Not found');

        res.render('trips/gallery/lightbox-meta', { media });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});



module.exports = router;

async function isAuthorized(db, userRole, userId, mediaId) {
    if (userRole === 'admin') return true;
    const [rows] = await db.execute('SELECT user_id from media WHERE id = ?', [mediaId]);
    if (rows.length === 0) return false;
    const ownerId = rows[0]?.user_id;
    return ownerId === userId;
}