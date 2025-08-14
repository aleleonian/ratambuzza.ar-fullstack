function globalAuthGuard(req, res, next) {
    const publicPaths = ['/', '/login', '/signup']

    if (publicPaths.includes(req.path)) {
        return next()
    }

    if (!req.session.user) {
        req.session.redirectTo = req.originalUrl
        return res.redirect('/login')
    }

    next()
}

module.exports = { globalAuthGuard }
