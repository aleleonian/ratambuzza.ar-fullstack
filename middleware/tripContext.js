// Loads trip by slug into req.trip
module.exports = async function tripContext(req, res, next) {
  const slug = req.params.slug;
  try {
    const [rows] = await req.db.execute('SELECT * FROM trips WHERE slug = ?', [slug]);
    const trip = rows[0];
    if (!trip) return res.status(404).render('404');
    req.trip = trip;
    next();
  } catch (err) {
    next(err);
  }
};
