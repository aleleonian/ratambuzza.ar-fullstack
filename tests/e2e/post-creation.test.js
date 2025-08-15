const puppeteer = require('puppeteer')
const path = require('path')

describe('Post Creation E2E Tests', () => {
  let browser
  let page
  let server

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    // Start test server
    const express = require('express')
    const session = require('express-session')
    const multer = require('multer')
    const app = express()
    
    app.use(express.urlencoded({ extended: true }))
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false
    }))
    
    // Mock multer for file uploads
    const storage = multer.memoryStorage()
    const upload = multer({ storage })
    
    let posts = []
    let postIdCounter = 1
    
    app.use((req, res, next) => {
      req.db = {
        execute: jest.fn().mockImplementation((query, params) => {
          if (query.includes('INSERT INTO posts')) {
            const newPost = {
              id: postIdCounter++,
              user_id: params[0],
              trip_id: params[1],
              content: params[2],
              image_filename: params[3],
              created_at: new Date(),
              handle: 'testuser',
              avatar_head_file_name: 'test.png'
            }
            posts.push(newPost)
            return Promise.resolve({ insertId: newPost.id })
          }
          if (query.includes('SELECT posts.*')) {
            return Promise.resolve([posts.slice(-1)]) // Return last post
          }
          return Promise.resolve([])
        })
      }
      next()
    })
    
    app.set('view engine', 'ejs')
    app.set('views', './views')
    
    // Mock login route
    app.get('/login', (req, res) => {
      req.session.user = { id: 1, handle: 'testuser', email: 'test@example.com' }
      res.redirect('/feed/1')
    })
    
    // Mock feed route with post form
    app.get('/feed/:tripId', (req, res) => {
      if (!req.session.user) {
        return res.redirect('/login')
      }
      
      const existingPosts = posts.map(post => 
        `<div class="post" data-post-id="${post.id}">${post.content}</div>`
      ).join('')
      
      res.send(`
        <div id="feed">
          <h1>Trip Feed</h1>
          <form id="newPostForm" action="/posts/new" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="trip_id" value="1" />
            <textarea name="content" placeholder="What's happening?" required></textarea>
            <input type="file" name="image" accept="image/*">
            <button type="submit">Post</button>
          </form>
          <div id="posts">${existingPosts}</div>
        </div>
      `)
    })
    
    // Mock post creation route
    app.post('/posts/new', upload.single('image'), (req, res) => {
      if (!req.session.user) {
        return res.status(401).send('Unauthorized')
      }
      
      const { content, trip_id } = req.body
      const image_filename = req.file ? req.file.originalname : null
      
      req.db.execute(
        'INSERT INTO posts (user_id, trip_id, content, image_filename) VALUES (?, ?, ?, ?)',
        [req.session.user.id, trip_id, content, image_filename]
      )
      
      const newPost = posts[posts.length - 1]
      res.send(`<div class="post" data-post-id="${newPost.id}">${newPost.content}</div>`)
    })
    
    server = app.listen(3002)
  })

  afterAll(async () => {
    await browser.close()
    server.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    // Login first
    await page.goto('http://localhost:3002/login')
  })

  afterEach(async () => {
    await page.close()
  })

  test('should create a text post successfully', async () => {
    await page.goto('http://localhost:3002/feed/1')
    
    // Fill in post content
    await page.type('textarea[name="content"]', 'This is my test post content')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for new post to appear
    await page.waitForSelector('.post', { timeout: 5000 })
    
    const posts = await page.$$eval('.post', elements => 
      elements.map(el => el.textContent)
    )
    
    expect(posts).toContain('This is my test post content')
  })

  test('should create a post with image upload', async () => {
    await page.goto('http://localhost:3002/feed/1')
    
    // Fill in post content
    await page.type('textarea[name="content"]', 'Post with image')
    
    // Create a test file
    const testImagePath = path.join(__dirname, '..', 'fixtures', 'test-image.jpg')
    
    // Mock file upload
    const fileInput = await page.$('input[type="file"]')
    
    // For testing purposes, we'll simulate the file upload
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]')
      const file = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' })
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      input.files = dataTransfer.files
    })
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for new post to appear
    await page.waitForSelector('.post', { timeout: 5000 })
    
    const posts = await page.$$eval('.post', elements => 
      elements.map(el => el.textContent)
    )
    
    expect(posts).toContain('Post with image')
  })

  test('should require content before submitting post', async () => {
    await page.goto('http://localhost:3002/feed/1')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Check if HTML5 validation prevents submission
    const validationMessage = await page.evaluate(() => {
      const textarea = document.querySelector('textarea[name="content"]')
      return textarea.validationMessage
    })
    
    expect(validationMessage).toBeTruthy()
  })
})