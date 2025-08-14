function globalAuthGuard(req, res, next) {
    const publicPaths = ['/', '/login', '/signup']
    const publicHTMX = ['/partials/avatar-ribbon']

    if (publicPaths.includes(req.path) ||
        publicHTMX.includes(req.path) ||
        req.path.startsWith('/.well-known/')) {
        return next()
    }

    if (!req.session.user) {
        req.session.redirectTo = req.originalUrl
        console.log("req.originalUrl->", req.originalUrl);
        return res.redirect('/login')
    }

    next()
}

module.exports = { globalAuthGuard }
