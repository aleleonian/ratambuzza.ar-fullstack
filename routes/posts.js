const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { requireLogin } = require('../middleware/requireLogin')

const router = express.Router()

// Set up multer for image uploads
const uploadDir = path.join(__dirname, '../public/uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`
    cb(null, uniqueName)
  }
})

const upload = multer({ storage })

// Handle new post submission
router.post('/new', requireLogin, upload.single('image'), async (req, res) => {
  const { content, trip_id } = req.body
  const image_filename = req.file ? req.file.filename : null

  await req.db.execute(
    'INSERT INTO posts (user_id, trip_id, content, image_filename) VALUES (?, ?, ?, ?)',
    [req.session.user.id, trip_id, content, image_filename]
  )

  res.redirect(`/feed/${trip_id}`)
})

module.exports = router
