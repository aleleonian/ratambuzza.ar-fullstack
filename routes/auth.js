
const express = require('express')
const bcrypt = require('bcrypt')
const router = express.Router()

router.get('/login', (req, res) => {
    res.render('login')
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body
    const [rows] = await req.db.execute('SELECT * FROM users WHERE email = ?', [email])
    const user = rows[0]
    if (!user) return res.render('login', { error: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.render('login', { error: 'Invalid credentials' })

    req.session.user = { id: user.id, handle: user.handle, email: user.email }
    res.redirect('/')
})

router.get('/signup', (req, res) => {
    res.render('signup')
})

router.post('/signup', async (req, res) => {
    const { email, password, handle } = req.body
    const hash = await bcrypt.hash(password, 10)
    await req.db.execute(
        'INSERT INTO users (email, password_hash, handle) VALUES (?, ?, ?)',
        [email, hash, handle]
    )
    res.redirect('/login')
})

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'))
})

module.exports = router

