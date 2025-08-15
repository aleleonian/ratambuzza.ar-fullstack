const express = require('express')
const router = express.Router()
const { requireLogin } = require('../middleware/requireLogin')

const POSTS_PER_PAGE = 10

// View posts for a specific trip
router.get('/:tripId', requireLogin, async (req, res) => {
    const tripId = req.params.tripId
    const [tripRows] = await req.db.execute('SELECT * FROM trips WHERE id = ?', [tripId])
    const trip = tripRows[0]
    if (!trip) return res.status(404).render('404', { title: '404 — Not Found', user: req.session.user })


    const [posts] = await req.db.execute(
        `SELECT p.*, u.handle, u.avatar_head_file_name,
            EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) AS liked_by_user,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.trip_id = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET 0`,
        [req.session.user.id, tripId, POSTS_PER_PAGE]
    )

    res.render('feed', { trip, posts })
})

// GET /feed/more?trip_id=1&offset=10
router.get('/more', requireLogin, async (req, res) => {
    const { trip_id, offset } = req.query
    const userId = req.session.user.id

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

    if (posts.length === 0) {
        return res.send('') // nothing more
    }

    res.render('partials/post-list', { posts })
})

module.exports = router
