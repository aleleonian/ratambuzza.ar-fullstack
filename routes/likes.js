const express = require('express')
const router = express.Router()
const { requireLogin } = require('../middleware/requireLogin')

router.post('/toggle', requireLogin, async (req, res) => {
    const userId = req.session.user.id
    const { post_id } = req.body

    console.log('userId->', userId);
    console.log('post_id->', post_id);

    const [[existing]] = await req.db.execute(
        'SELECT id FROM likes WHERE user_id = ? AND post_id = ?', [userId, post_id]
    )

    if (existing) {
        await req.db.execute('DELETE FROM likes WHERE id = ?', [existing.id])
    } else {
        await req.db.execute('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, post_id])
    }

    const [[updated]] = await req.db.execute(`
    SELECT 
      COUNT(*) AS like_count,
      EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?) AS liked_by_user
    FROM likes WHERE post_id = ?
  `, [userId, post_id, post_id])

    res.render('partials/like-button', {
        post: {
            id: post_id,
            liked_by_user: !!updated.liked_by_user,
            like_count: updated.like_count
        }
    })
})

module.exports = router
