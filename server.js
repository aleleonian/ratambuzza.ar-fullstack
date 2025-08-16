// server.js
require('dotenv').config()
const express = require('express')
const session = require('express-session')
const path = require('path')
const mysql = require('mysql2/promise')
const authRoutes = require('./routes/auth')
const viajesRoutes = require('./routes/viajes')
// const feedRoutes = require('./routes/feed')
const app = express();
// const postsRoutes = require('./routes/posts')
const MySQLStore = require('express-mysql-session')(session)
// const likeRoutes = require('./routes/likes')
const tripRoutes = require('./routes/trips');

const PORT = process.env.PORT || 3000

// DB connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
})

const sessionStore = new MySQLStore({}, pool)

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use('/images', express.static('public/images', {
    maxAge: '7d', // one week
    immutable: true
}))
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}))


// Make db + user available in req
app.use((req, res, next) => {
    req.db = pool
    res.locals.user = req.session.user
    next()
})



app.use('/', authRoutes)

app.get('/', async (req, res) => {
    const [crew] = await req.db.execute('SELECT handle, avatar_head_file_name FROM users ORDER BY handle')
    res.render('home', { user: req.session.user, crew })
})

// app.use('/feed', feedRoutes)
// app.use('/posts', postsRoutes)
// app.use('/likes', likeRoutes)
app.use('/trips', tripRoutes);

//TODO deprecated
app.get('/partials/avatar-ribbon', async (req, res) => {
    const [crew] = await req.db.execute('SELECT handle, avatar_head_file_name FROM users ORDER BY handle')
    console.log("returning crew:", crew);
    res.render('partials/avatar-ribbon', { crew })
})

app.use('/viajes', viajesRoutes)

app.get(/^\/\.well-known\/.*/, (req, res) => {
    res.status(204).end()
})

app.use((req, res) => {
    res.status(404).render('404', {
        title: '404 — Not Found',
        user: req.session.user
    })
})

app.listen(PORT, () => console.log(`Ratambuzza server on http://localhost:${PORT}`))
