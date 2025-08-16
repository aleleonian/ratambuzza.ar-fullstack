const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { requireLogin } = require('../middleware/requireLogin');

// Multer setup for image uploads
const uploadDir = path.join(__dirname, '../public/uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// Get trip by slug before all handlers
router.param('slug', async (req, res, next, slug) => {
    const [rows] = await req.db.execute('SELECT * FROM trips WHERE slug = ?', [slug]);
    const trip = rows[0];
    if (!trip) return res.status(404).render('404');
    req.trip = trip;
    next();
});

// Constants
const POSTS_PER_PAGE = 3;

// GET /trips/:slug/feed
router.get('/:slug/feed', requireLogin, async (req, res) => {
    const offset = 0;
    const userId = req.session.user.id;
    const trip = req.trip;

    const [posts] = await req.db.execute(
        `SELECT p.*, u.handle, u.avatar_head_file_name,
      EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) AS liked_by_user,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.trip_id = ?
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT ${POSTS_PER_PAGE} OFFSET ${offset}`,
        [userId, trip.id]
    );

    const moreUrl = posts.length === POSTS_PER_PAGE
        ? `/trips/${trip.slug}/feed/more?offset=${POSTS_PER_PAGE}`
        : null;

    const [trips] = await req.db.execute('SELECT * FROM trips ORDER BY start_date DESC');

    res.render('trips/feed', { trips, trip, posts, moreUrl, POSTS_PER_PAGE });
});

// GET /trips/:slug/feed/more
router.get('/:slug/feed/more', requireLogin, async (req, res) => {
    const offset = parseInt(req.query['current-offset'] || req.query.offset, 10) || 0
    const userId = req.session.user.id;
    const trip = req.trip;

    console.log('Loading more posts:', {
        offset,
        userId,
        rawQuery: req.query,
        offsetType: typeof offset
    });

    const [posts] = await req.db.execute(`
    SELECT p.*, u.handle, u.avatar_head_file_name,
      EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) AS liked_by_user,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.trip_id = ?
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT ${POSTS_PER_PAGE} OFFSET ${offset}
  `, [userId, trip.id]);

    // const newOffset = offset + POSTS_PER_PAGE;
    // const moreUrl = posts.length === POSTS_PER_PAGE
    //     ? `/trips/${trip.slug}/feed/more?offset=${newOffset}`
    //     : null;

    if (posts.length === 0) {
        return res.send('<div data-no-more-posts="true">No more posts found</div>');
    }

    res.render('partials/just-posts', { trip, posts });
});

// POST /trips/:slug/posts/new
router.post('/:slug/posts/new', requireLogin, upload.single('image'), async (req, res) => {
    const content = req.body.content;
    const trip = req.trip;
    const image_filename = req.file ? req.file.filename : null;

    await req.db.execute(
        'INSERT INTO posts (user_id, trip_id, content, image_filename) VALUES (?, ?, ?, ?)',
        [req.session.user.id, trip.id, content, image_filename]
    );

    const [rows] = await req.db.execute(`
    SELECT posts.*, users.handle, users.avatar_head_file_name, users.avatar_file_name
    FROM posts
    JOIN users ON posts.user_id = users.id
    WHERE posts.id = LAST_INSERT_ID()
  `);

    const post = rows[0];

    res.render('partials/post', { trip, post });
});

// POST /trips/:slug/posts/delete
router.post('/:slug/posts/delete', requireLogin, async (req, res) => {
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
});

// POST /trips/:slug/posts/:post_id/likes/toggle
router.post('/:slug/posts/:post_id/likes/toggle', requireLogin, async (req, res) => {
    const userId = req.session.user.id;
    const post_id = req.params.post_id;

    const [[existing]] = await req.db.execute(
        'SELECT id FROM likes WHERE user_id = ? AND post_id = ?', [userId, post_id]
    );

    if (existing) {
        await req.db.execute('DELETE FROM likes WHERE id = ?', [existing.id]);
    } else {
        await req.db.execute('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, post_id]);
    }

    const [[updated]] = await req.db.execute(`
    SELECT 
      COUNT(*) AS like_count,
      EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?) AS liked_by_user
    FROM likes WHERE post_id = ?
  `, [userId, post_id, post_id]);

    res.render('partials/like-button', {
        post: {
            id: post_id,
            liked_by_user: !!updated.liked_by_user,
            like_count: updated.like_count
        }
    });
});

router.get('/:slug', (req, res) => {
    res.redirect(`/trips/${req.trip.slug}/feed`);
});

module.exports = router;
