const express = require('express');
const router = express.Router({ mergeParams: true });
const postcards = require('./postcards');
router.use('/:slug', postcards);

router.get('/playground', (req, res) => {
    res.render('trips/playground/index');
});

router.get('/playground/postcards', async (req, res) => {
    res.render('playground/index', {
        currentView: 'postcards',
        // other data needed for the postcards view
    });
});

module.exports = router 