const express = require('express');
const tripContext = require('../../middleware/tripContext');

const feed = require('./feed');
const posts = require('./posts');
const likes = require('./likes');

const router = express.Router();

// tripContext must run for any route with :slug
router.param('slug', (req, res, next, slug) => tripContext(req, res, next));

// Mount subrouters with mergeParams enabled in each child
router.use('/:slug', feed);   // /trips/:slug/feed, /feed/more
router.use('/:slug', posts);  // /trips/:slug/posts/...
router.use('/:slug', likes);  // /trips/:slug/likes/...

// Default: /trips/:slug → redirect to feed
router.get('/:slug', (req, res) => {
  res.redirect(`/trips/${req.params.slug}/feed`);
});

module.exports = router;
