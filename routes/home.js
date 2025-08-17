const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/requireLogin')

router.get('/', requireLogin, async (req, res) => {
    const [trips] = await req.db.execute('SELECT * FROM trips ORDER BY start_date DESC');
    const now = new Date();

    const currentTrip = trips.find(t => new Date(t.start_date) <= now && new Date(t.end_date) >= now);
    const upcomingTrip = trips.find(t => new Date(t.start_date) > now);

    if (upcomingTrip || currentTrip) {
        return res.render('home/split-landing', { trip: upcomingTrip });
    }

    res.render('home/index', {
        currentTrip,
        pastTrips: trips.filter(t => new Date(t.end_date) < now)
    });
});


module.exports = router;