module.exports = async function tripContext(req, res, next) {
    try {


        const now = new Date();
        const [rows] = await req.db.execute(`
      SELECT * FROM trips
      WHERE name = 'RIO 2025'
    `);
    //     const [rows] = await req.db.execute(`
    //   SELECT * FROM trips
    //   WHERE start_date <= ? AND end_date >= ?
    //      OR start_date > ?
    //   ORDER BY start_date ASC
    //   LIMIT 1
    // `, [now, now, now]);

        const trip = rows[0] || null;

        res.locals.currentOrUpcomingTrip = trip;
        res.locals.tripMode = trip ? (new Date(trip.start_date) <= now ? 'current' : 'upcoming') : null;

        next();
    } catch (err) {
        next(err);
    }
};
