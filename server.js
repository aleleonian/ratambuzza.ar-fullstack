// server.js
require('dotenv').config()
const express = require('express')
const session = require('express-session')
const path = require('path')
const mysql = require('mysql2/promise')
const authRoutes = require('./routes/auth')

const app = express()
const PORT = process.env.PORT || 3000

// DB connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
})

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
)

// Make db + user available in req
app.use((req, res, next) => {
  req.db = pool
  res.locals.user = req.session.user
  next()
})

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use('/', authRoutes)

app.get('/', (req, res) => {
  res.render('home')
})

app.listen(PORT, () => console.log(`Ratambuzza server on http://localhost:${PORT}`))
