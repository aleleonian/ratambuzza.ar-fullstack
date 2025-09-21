const express = require('express');
const { requireLogin } = require('../../middleware/requireLogin');
const { uploadDir, uploadMultiple, getImageSize, createThumbnail } = require('../../lib/upload');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const router = express.Router({ mergeParams: true });

// POST /trips/:slug/posts/new
router.post('/posts/new', requireLogin, uploadMultiple, async (req, res, next) => {
  try {
    const content = req.body['new-post-content'];
    const trip = req.trip;
    const user = req.session.user;
    const width = 1600;
    const height = 1600;
    const quality = 80;

    const [postResult] = await req.db.execute(
      'INSERT INTO posts (user_id, trip_id, content) VALUES (?, ?, ?)',
      [user.id, trip.id, content]
    );

    const postId = postResult.insertId;

    const mediaInsertions = req.files.map(async (file) => {

      if (!fs.existsSync(file.path)) {
        console.error('❌ File does not exist:', file.path);
      }

      // let's resize files and generate thumbs

      const resizedName = 'resized-' + file.filename;
      const resizedUrl = "/uploads/" + resizedName;

      const originalPath = path.join(uploadDir, file.filename);
      const outputPath = path.join(uploadDir, resizedName);

      await sharp(file.path)
        .rotate()
        .resize({ width, height, fit: 'inside' })
        .jpeg({ quality })
        .toFile(outputPath);

      const thumbName = `thumb-${file.filename}`;
      const thumbnailUrl = await createThumbnail(file.path, thumbName);

      fs.unlinkSync(originalPath);

      return req.db.execute(
        'INSERT INTO media (post_id, trip_id, user_id, url, thumbnail_url, width, height) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [postId, trip.id, user.id, resizedUrl, thumbnailUrl, width, height]
      );
    });

    await Promise.all(mediaInsertions);

    // 1. Get the post
    const [postRows] = await req.db.execute(`
    SELECT p.*, u.handle, u.avatar_head_file_name,
      EXISTS (SELECT 1 FROM likes_posts WHERE user_id = ? AND post_id = p.id) AS liked_by_user,
      (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) AS like_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
  `, [user.id, postId]);

    const post = postRows[0];

    // 2. Get associated media
    const [mediaRows] = await req.db.execute(`
    SELECT id, url, thumbnail_url, width, height
    FROM media
    WHERE post_id = ?
  `, [postId]);

    post.media = mediaRows;
    res.setHeader('X-Toast', 'Se posteó.');
    res.setHeader('X-Toast-Type', 'success');
    return res.render('trips/feed/post', { trip, post });
  } catch (e) { next(e); }
});

// POST /trips/:slug/posts/delete
router.post('/posts/delete', requireLogin, async (req, res, next) => {
  try {
    const { post_id } = req.body;
    const userId = req.session.user.id;

    const [rows] = await req.db.execute(
      'SELECT user_id FROM posts WHERE id = ?', [post_id]
    );

    if (!rows.length || rows[0].user_id !== userId) {
      return res.status(403).send('Not allowed');
    }

    // find out if there are images related to that post
    // SELECT url, thumbnail_url, id FROM `media` WHERE post_id = 107

    const [mediaItems] = await req.db.execute(
      'SELECT url, thumbnail_url, id FROM `media` WHERE post_id = ?', [post_id]
    );

    const mediaFileDeletions = mediaItems.map(async (item) => {
      if (item.url) {
        const filePath = path.join(process.cwd(), 'public', item.url.replace(/^\/+/, ''));
        try {
          fs.unlinkSync(filePath);
        }
        catch (error) {
          console.error("Failed trying to delete " + filePath)
        }
      }

      if (item.thumbnail_url) {
        const filePath = path.join(process.cwd(), 'public', item.thumbnail_url.replace(/^\/+/, ''));
        try {
          fs.unlinkSync(filePath);
        }
        catch (error) {
          console.error("Failed trying to delete " + filePath)
        }
      }

      // clean likes_media
      await req.db.execute('DELETE FROM likes_media WHERE media_id = ?', [item.id]);
      // clea media_tags
      await req.db.execute('DELETE FROM media_tags WHERE media_id = ?', [item.id]);

      await req.db.execute('DELETE FROM media WHERE id = ?', [item.id]);
    });

    await Promise.all(mediaFileDeletions);

    // delete from likes_post first
    await req.db.execute('DELETE FROM likes_posts WHERE post_id = ?', [post_id]);
    await req.db.execute('DELETE FROM posts WHERE id = ?', [post_id]);

    res.setHeader('X-Toast', "Post borrado!");
    res.setHeader('X-Toast-Type', 'success');
    res.send('');

  } catch (e) { next(e); }
});

module.exports = router;
