const express = require('express');
const router = express.Router({ mergeParams: true });

// tiny in-memory cache
const cache = new Map(); // key: trip.id, value: { html, data, expiresAt }

const TTL_MS = 10 * 60 * 1000; // 10 min

router.get('/crew-fragment', async (req, res, next) => {
  try {
    const trip = req.trip;

    // serve from cache if fresh
    const cached = cache.get(trip.id);
    if (cached && cached.expiresAt > Date.now()) {
      res.set('Cache-Control', 'private, max-age=60'); // let browser reuse for 60s
      return res.send(cached.html);
    }

    // fetch minimal fields
    const [rows] = await req.db.execute(
      `SELECT u.handle, u.avatar_file_name, u.description
       FROM users u
       JOIN trip_members tm ON tm.user_id = u.id
       WHERE tm.trip_id = ?
       ORDER BY u.handle ASC`,
      [trip.id]
    );

    console.log("avatars->" + JSON.stringify(rows));

    res.render('partials/avatar-grid', { people: rows }, (err, html) => {
      if (err) return next(err);
      cache.set(trip.id, { html, data: rows, expiresAt: Date.now() + TTL_MS });
      res.set('Cache-Control', 'private, max-age=60');
      res.send(html);
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
