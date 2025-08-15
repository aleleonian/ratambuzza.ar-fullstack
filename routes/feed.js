// routes/feed.js
const express = require('express')
const router = express.Router()
const { requireLogin } = require('../middleware/requireLogin')

// Constants
const POSTS_PER_PAGE = 1

// GET /feed/:tripId
router.get('/:trip_id', requireLogin, async (req, res) => {
    const trip_id = parseInt(req.params.trip_id, 10)
    const offset = parseInt(req.query.offset || '0', 10)

    const [tripRows] = await req.db.execute('SELECT * FROM trips WHERE id = ?', [trip_id])
    const trip = tripRows[0]
    if (!trip) return res.status(404).render('404')

    const userId = parseInt(req.session.user.id, 10);

    if (
        typeof trip_id !== 'number' || isNaN(trip_id) ||
        typeof POSTS_PER_PAGE !== 'number' || isNaN(POSTS_PER_PAGE)
    ) {
        console.error('🛑 Invalid SQL arguments:', {
            trip_id,
            POSTS_PER_PAGE,
            offset: 0
        })
        return res.status(500).send('Internal Server Error: bad query args')
    }

    const [posts] = await req.db.execute(
        `SELECT p.*, u.handle, u.avatar_head_file_name,
          EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) AS liked_by_user,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count
   FROM posts p
   JOIN users u ON p.user_id = u.id
   WHERE p.trip_id = ?
   ORDER BY p.created_at DESC
   LIMIT ${POSTS_PER_PAGE} OFFSET ${offset}`,
        [userId, trip_id]
    )

    const moreUrl = `/feed/more?trip_id=${trip_id}&offset=${POSTS_PER_PAGE}`

    const [trips] = await req.db.execute('SELECT * FROM trips ORDER BY start_date DESC')

    res.render('feed', { trips, trip, posts, moreUrl, POSTS_PER_PAGE })
})

// GET /feed/more?trip_id=1&offset=10
router.get('/more', requireLogin, async (req, res) => {
    const userId = req.session.user.id
    const trip_id = parseInt(req.query.trip_id, 10)
    const offset = parseInt(req.query.offset, 10)

    if (isNaN(trip_id) || isNaN(offset)) {
        return res.status(400).send('Invalid trip_id or offset')
    }

    const [posts] = await req.db.execute(
        `SELECT p.*, u.handle, u.avatar_head_file_name,
            EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) AS liked_by_user,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.trip_id = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
        [userId, trip_id, POSTS_PER_PAGE, offset]
    )

    if (posts.length === 0) return res.send('')

    const moreUrl = `/feed/more?trip_id=${trip_id}&offset=${offset + POSTS_PER_PAGE}`
    res.render('partials/post-list', { posts, moreUrl })
})


module.exports = router
