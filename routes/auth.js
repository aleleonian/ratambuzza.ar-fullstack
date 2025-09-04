
const express = require('express')
const bcrypt = require('bcrypt')
const router = express.Router()


router.get('/login', (req, res) => {
    res.render('login')
})

router.get('/signup', (req, res) => {
    res.render('signup')
})

router.post('/login', async (req, res) => {
    const ALLOWED_REDIRECTS = ['/', '/trips', '/gallery', '/crew']

    const { handle, password } = req.body
    const [rows] = await req.db.execute('SELECT * FROM users WHERE handle = ?', [handle])
    const user = rows[0]
    if (!user) return res.render('login', { error: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) return res.render('login', { error: 'Invalid credentials' })

    req.session.user = { id: user.id, handle: user.handle, email: user.email, role: user.role, avatarFileName: user.avatar_file_name, avatarHeadFileName: user.avatar_head_file_name }

    const redirectTo = req.session.redirectTo
    delete req.session.redirectTo

    let safeRedirect = '/'
    if (typeof redirectTo === 'string' && redirectTo.startsWith('/')) {
        if (ALLOWED_REDIRECTS.includes(redirectTo) || redirectTo.startsWith('/feed/')) {
            safeRedirect = redirectTo
        }
    }

    req.session.save(err => {
        if (err) {
            console.error('❌ Session save error:', err);
            return res.status(500).send('Internal error');
        }
        res.redirect(safeRedirect);
    });

})

router.post('/signup', async (req, res) => {
    const { email, password, handle } = req.body
    const hash = await bcrypt.hash(password, 10)
    const avatar_head_file_name = `${handle}_head_file_name`;
    const avatar_file_name = `${handle}_file_name`;
    await req.db.execute(
        'INSERT INTO users (email, password_hash, handle, avatar_file_name, avatar_head_file_name) VALUES (?, ?, ?, ?, ?)',
        [email, hash, handle, avatar_file_name, avatar_head_file_name]
    )
    res.redirect('/login')
})

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'))
})

module.exports = router

