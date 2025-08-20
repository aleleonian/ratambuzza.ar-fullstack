const express = require('express');
const { requireLogin } = require('../../middleware/requireLogin');
const { upload, uploadDir } = require('../../lib/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router({ mergeParams: true });

// POST /trips/:slug/posts/new
router.post('/posts/new', requireLogin, upload.single('image'), async (req, res, next) => {
  try {
    const content = req.body['new-post-content'];
    const trip = req.trip;
    const image_filename = req.file ? req.file.filename : null;

    await req.db.execute(
      'INSERT INTO posts (user_id, trip_id, content, image_filename) VALUES (?, ?, ?, ?)',
      [req.session.user.id, trip.id, content, image_filename]
    );

    const [rows] = await req.db.execute(`
      SELECT p.*, u.handle, u.avatar_head_file_name,
        EXISTS (SELECT 1 FROM likes_posts WHERE user_id = ? AND post_id = p.id) AS liked_by_user,
        (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) AS like_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = LAST_INSERT_ID()
    `, [req.session.user.id]);

    const post = rows[0];
    return res.render('trips/feed/post', { trip, post });
  } catch (e) { next(e); }
});

// POST /trips/:slug/posts/delete
router.post('/posts/delete', requireLogin, async (req, res, next) => {
  try {
    const { post_id } = req.body;
    const userId = req.session.user.id;

    const [rows] = await req.db.execute(
      'SELECT user_id, image_filename FROM posts WHERE id = ?', [post_id]
    );

    if (!rows.length || rows[0].user_id !== userId) {
      return res.status(403).send('Not allowed');
    }

    if (rows[0].image_filename) {
      const imagePath = path.join(uploadDir, rows[0].image_filename);
      fs.unlink(imagePath, (err) => {
        if (err) console.warn('Failed to delete image:', err.message);
      });
    }

    await req.db.execute('DELETE FROM posts WHERE id = ?', [post_id]);
    res.send('');
  } catch (e) { next(e); }
});

module.exports = router;
