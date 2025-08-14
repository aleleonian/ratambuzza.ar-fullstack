const express = require('express')
const router = express.Router()
const { requireLogin } = require('../middleware/requireLogin')

// View posts for a specific trip
router.get('/:tripId', requireLogin, async (req, res) => {
    const tripId = req.params.tripId

    const [posts] = await req.db.execute(
        `SELECT posts.*, users.handle, users.avatar_file_name, users.avatar_head_file_name
     FROM posts
     JOIN users ON posts.user_id = users.id
     WHERE trip_id = ?
     ORDER BY created_at DESC`,
        [tripId]
    )

    const [tripRows] = await req.db.execute(
        'SELECT name FROM trips WHERE id = ?', [tripId]
    )

    if (tripRows.length === 0) {
        return res.status(404).render('404', { title: '404 — Not Found', user: req.session.user })
    }

    const trip = tripRows[0]
    console.log("posts->", posts);
    res.render('feed', { user: req.session.user, trip, posts })
})

module.exports = router
