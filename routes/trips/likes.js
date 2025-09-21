const express = require('express');
const { requireLogin } = require('../../middleware/requireLogin');

const router = express.Router({ mergeParams: true });

// POST /trips/:slug/posts/likes/toggle   (kept body { post_id } for simplicity)
router.post('/posts/likes/toggle', requireLogin, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const { post_id } = req.body;
    const trip = req.trip;

    console.log('userId->', userId);
    console.log('post_id->', post_id);
    
    const [[existing]] = await req.db.execute(
      'SELECT id FROM likes_posts WHERE user_id = ? AND post_id = ?', [userId, post_id]
    );

    if (existing) {
      await req.db.execute('DELETE FROM likes_posts WHERE id = ?', [existing.id]);
    } else {
      await req.db.execute('INSERT INTO likes_posts (user_id, post_id) VALUES (?, ?)', [userId, post_id]);
    }

    const [[updated]] = await req.db.execute(`
      SELECT 
        COUNT(*) AS like_count,
        EXISTS(SELECT 1 FROM likes_posts WHERE user_id = ? AND post_id = ?) AS liked_by_user
      FROM likes_posts WHERE post_id = ?
    `, [userId, post_id, post_id]);

    res.render('trips/feed/like-button', {
      trip,
      post: {
        id: post_id,
        liked_by_user: !!updated.liked_by_user,
        like_count: updated.like_count
      }
    });
  } catch (e) { next(e); }
});

module.exports = router;
