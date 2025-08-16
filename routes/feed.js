// routes/feed.js
const express = require('express')
const router = express.Router()
const { requireLogin } = require('../middleware/requireLogin')

// Constants
const POSTS_PER_PAGE = 1

// GET /feed/more - accepts query params from hx-include
router.get('/more', requireLogin, async (req, res) => {
    const trip_id = parseInt(req.query['trip-id'] || req.query.trip_id, 10)
    const offset = parseInt(req.query['current-offset'] || req.query.offset, 10) || 0
    const userId = parseInt(req.session.user.id, 10)

    console.log('Loading more posts:', { 
        trip_id, 
        offset, 
        userId,
        rawQuery: req.query,
        tripIdType: typeof trip_id,
        offsetType: typeof offset
    });

    // First, get total count of posts for this trip
    const [countResult] = await req.db.execute(
        'SELECT COUNT(*) as total FROM posts WHERE trip_id = ?', 
        [trip_id]
    );
    const totalPosts = countResult[0].total;

    console.log(`Trip ${trip_id} has ${totalPosts} total posts, requesting offset ${offset}`);

    // Fetch posts
    const [posts] = await req.db.execute(`
    SELECT p.*, u.handle, u.avatar_head_file_name,
      EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) AS liked_by_user,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.trip_id = ?
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT ${POSTS_PER_PAGE} OFFSET ${offset}
  `, [userId, trip_id])

    const newOffset = offset + POSTS_PER_PAGE
    const moreUrl = posts.length === POSTS_PER_PAGE ? `/feed/more?trip_id=${trip_id}&offset=${newOffset}` : null

    console.log('Returning posts:', {
        offset,
        newOffset,
        POSTS_PER_PAGE,
        returned: posts.length,
        hasMore: !!moreUrl,
        postIds: posts.map(p => p.id)
    });

    if (posts.length === 0) {
        return res.send('<p>No more posts found</p>')
    }

    res.render('partials/just-posts', {
        posts
    })
})

// GET /feed/:tripId
router.get('/:trip_id', requireLogin, async (req, res) => {
    const trip_id = parseInt(req.params.trip_id, 10)
    const offset = 0 // Always start from 0 for the main feed page

    const [tripRows] = await req.db.execute('SELECT * FROM trips WHERE id = ?', [trip_id])
    const trip = tripRows[0]
    if (!trip) return res.status(404).render('404')

    const userId = parseInt(req.session.user.id, 10);

    const [posts] = await req.db.execute(
        `SELECT p.*, u.handle, u.avatar_head_file_name,
          EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) AS liked_by_user,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count
   FROM posts p
   JOIN users u ON p.user_id = u.id
   WHERE p.trip_id = ?
   ORDER BY p.created_at DESC, p.id DESC
   LIMIT ${POSTS_PER_PAGE} OFFSET ${offset}`,
        [userId, trip_id]
    )

    // Only show moreUrl if we got the full page of posts
    const moreUrl = posts.length === POSTS_PER_PAGE ? `/feed/more?trip_id=${trip_id}&offset=${POSTS_PER_PAGE}` : null

    const [trips] = await req.db.execute('SELECT * FROM trips ORDER BY start_date DESC')

    res.render('feed', { trips, trip, posts, moreUrl, POSTS_PER_PAGE })
})



module.exports = router
