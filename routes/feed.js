const express = require('express')
const router = express.Router()
const { requireLogin } = require('../middleware/requireLogin')

// View posts for a specific trip
router.get('/:tripId', requireLogin, async (req, res) => {
    const tripId = req.params.tripId

    const [posts] = await req.db.execute(
        `SELECT 
        posts.*, users.handle, users.avatar_file_name, users.avatar_head_file_name, 
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS like_count,
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) AS liked_by_user
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.trip_id = ?
        ORDER BY posts.created_at DESC
        `,
        [req.session.user.id, tripId]
    )

    const [tripRows] = await req.db.execute(
        'SELECT name, id FROM trips WHERE id = ?', [tripId]
    )

    if (tripRows.length === 0) {
        return res.status(404).render('404', { title: '404 — Not Found', user: req.session.user })
    }

    const trip = tripRows[0];

    const [trips] = await req.db.execute('SELECT * FROM trips ORDER BY start_date DESC')

    console.log("posts->", posts);
    console.log("trip->", trip);
    console.log("trips->", trips);

    res.render('feed', { user: req.session.user, trips, trip, posts })
})

module.exports = router
