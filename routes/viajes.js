const express = require('express')
const router = express.Router()
const { requireLogin } = require('../middleware/requireLogin')
// List all trips
router.get('/', requireLogin, async (req, res) => {
    const [trips] = await req.db.execute('SELECT * FROM trips ORDER BY start_date DESC')
    res.render('viajes', { user: req.session.user, trips })
})

module.exports = router
