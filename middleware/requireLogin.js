function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.session.redirectTo = req.originalUrl
    return res.redirect('/login')
  }
  next()
}

module.exports = { requireLogin }
