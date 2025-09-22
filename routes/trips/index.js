const express = require('express');
const tripSlug = require('../../middleware/tripSlug');

const feed = require('./feed');
const posts = require('./posts');
const likes = require('./likes');
const crew = require('./crew');
const media = require('./media');
const playground = require('./playground');

const router = express.Router();

router.get('/', async (req, res) => {
  const [trips] = await req.db.execute('SELECT * FROM trips ORDER BY start_date DESC')
  res.render('viajes', { user: req.session.user, trips })
})

// tripSlug must run for any route with :slug
router.param('slug', (req, res, next, slug) => tripSlug(req, res, next));

// Mount subrouters with mergeParams enabled in each child
router.use('/:slug', feed);   // /trips/:slug/feed, /feed/more
router.use('/:slug', posts);  // /trips/:slug/posts/...
router.use('/:slug', likes);  // /trips/:slug/likes/...
router.use('/:slug', crew);  // /trips/:slug/likes/...
router.use('/:slug', media);
router.use('/:slug', playground);

// Default: /trips/:slug → redirect to feed
router.get('/:slug', (req, res) => {
  res.redirect(`/trips/${req.params.slug}/feed`);
});

module.exports = router;
