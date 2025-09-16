const express = require('express');
const { requireLogin } = require('../../middleware/requireLogin');
const { POSTS_PER_PAGE } = require('../../lib/config');

const router = express.Router({ mergeParams: true });

// GET /trips/:slug/feed
router.get('/feed', requireLogin, async (req, res, next) => {
    try {
        // const offset = 0;
        const userId = req.session.user.id;
        const trip = req.trip;

        const [posts] = await req.db.execute(
            `SELECT p.*, u.handle, u.avatar_head_file_name,
        EXISTS (SELECT 1 FROM likes_posts WHERE user_id = ? AND post_id = p.id) AS liked_by_user,
        (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) AS like_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.trip_id = ?
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT ${POSTS_PER_PAGE}`,
            //    LIMIT ${POSTS_PER_PAGE} OFFSET ${offset}`,
            [userId, trip.id]
        );

        const theresMore = posts.length === POSTS_PER_PAGE;

        // 2. Get associated media

        //     posts.forEach(async post => {
        //         const [mediaRows] = await req.db.execute(`
        //     SELECT id, url, thumbnail_url, width, height
        //     FROM media
        //     WHERE post_id = ?
        // `, [post.id]);
        //         post.media = mediaRows;
        //     });

        await Promise.all(posts.map(async post => {
            const [mediaRows] = await req.db.execute(`
        SELECT id, url, thumbnail_url, width, height
        FROM media
        WHERE post_id = ?
    `, [post.id]);
            post.media = mediaRows;
        }));
        
        const [trips] = await req.db.execute('SELECT * FROM trips ORDER BY start_date DESC');

        console.log('GET /feed posts->', posts);

        res.render('trips/feed', { trips, trip, posts, theresMore, POSTS_PER_PAGE });
    } catch (e) { next(e); }
});

// GET /trips/:slug/feed/more
router.get('/feed/more', requireLogin, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const trip = req.trip;

        const excludeIds = req.query.exclude_ids
            ? req.query.exclude_ids.split(',').map((id) => parseInt(id, 10))
            : [];

        let whereClause = 'WHERE p.trip_id = ?';
        let params = [trip.id];

        if (excludeIds.length) {
            const placeholders = excludeIds.map(() => '?').join(',');
            whereClause += ` AND p.id NOT IN (${placeholders})`;
            params = params.concat(excludeIds);
        }

        const finalParams = [userId, ...params];

        const [posts] = await req.db.execute(`
      SELECT p.*, u.handle, u.avatar_head_file_name,
        EXISTS (SELECT 1 FROM likes_posts WHERE user_id = ? AND post_id = p.id) AS liked_by_user,
        (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) AS like_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      ${whereClause}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT ${POSTS_PER_PAGE}
    `, finalParams);

        if (!posts.length) {
            return res.send('<div data-no-more-posts="true">No hay más che, qué querés.</div>');
        }

        res.render('trips/feed/just-posts', { trip, posts });
    } catch (e) { next(e); }
});

module.exports = router;
