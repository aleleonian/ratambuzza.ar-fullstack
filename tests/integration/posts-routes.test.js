const request = require('supertest')
const express = require('express')
const session = require('express-session')
const postsRoutes = require('../../routes/posts')
const { requireLogin } = require('../../middleware/requireLogin')
const path = require('path')

describe('Posts Routes Integration Tests', () => {
  let app

  beforeEach(() => {
    app = express()
    app.use(express.urlencoded({ extended: true }))
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false
    }))
    
    // Mock database
    app.use((req, res, next) => {
      req.db = {
        execute: jest.fn()
      }
      next()
    })

    app.set('view engine', 'ejs')
    app.set('views', './views')
    app.use('/posts', postsRoutes)
  })

  test('POST /posts/new should create post when authenticated', async () => {
    const mockUser = { id: 1, handle: 'testuser', email: 'test@example.com' }
    const mockPost = {
      id: 1,
      user_id: 1,
      trip_id: 1,
      content: 'Test post content',
      image_filename: null,
      handle: 'testuser',
      avatar_head_file_name: 'test.png',
      avatar_file_name: 'test_full.png'
    }

    const mockExecute = jest.fn()
      .mockResolvedValueOnce({}) // INSERT query
      .mockResolvedValueOnce([[mockPost]]) // SELECT query

    const agent = request.agent(app)
    
    // Set up session
    await agent
      .get('/posts')
      .set('Cookie', 'connect.sid=test')

    app.use((req, res, next) => {
      req.db.execute = mockExecute
      req.session.user = mockUser
      next()
    })

    const response = await agent
      .post('/posts/new')
      .field('content', 'Test post content')
      .field('trip_id', '1')

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO posts (user_id, trip_id, content, image_filename) VALUES (?, ?, ?, ?)',
      [1, '1', 'Test post content', null]
    )
  })

  test('POST /posts/new should handle image upload', async () => {
    const mockUser = { id: 1, handle: 'testuser', email: 'test@example.com' }
    const mockPost = {
      id: 1,
      user_id: 1,
      trip_id: 1,
      content: 'Post with image',
      image_filename: 'test-image.jpg',
      handle: 'testuser',
      avatar_head_file_name: 'test.png',
      avatar_file_name: 'test_full.png'
    }

    const mockExecute = jest.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce([[mockPost]])

    app.use((req, res, next) => {
      req.db.execute = mockExecute
      req.session.user = mockUser
      next()
    })

    // Create a small test image buffer
    const testImageBuffer = Buffer.from('fake-image-data')

    const response = await request(app)
      .post('/posts/new')
      .field('content', 'Post with image')
      .field('trip_id', '1')
      .attach('image', testImageBuffer, 'test.jpg')

    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO posts (user_id, trip_id, content, image_filename) VALUES (?, ?, ?, ?)',
      expect.arrayContaining([1, '1', 'Post with image', expect.any(String)])
    )
  })

  test('POST /posts/new should require authentication', async () => {
    const response = await request(app)
      .post('/posts/new')
      .field('content', 'Test post')
      .field('trip_id', '1')

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/login')
  })

  test('POST /posts/new should return post partial on success', async () => {
    const mockUser = { id: 1, handle: 'testuser', email: 'test@example.com' }
    const mockPost = {
      id: 1,
      user_id: 1,
      trip_id: 1,
      content: 'Test content',
      image_filename: null,
      handle: 'testuser',
      avatar_head_file_name: 'test.png',
      avatar_file_name: 'test_full.png'
    }

    const mockExecute = jest.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce([[mockPost]])

    app.use((req, res, next) => {
      req.db.execute = mockExecute
      req.session.user = mockUser
      next()
    })

    // Mock the view rendering
    app.set('views', path.join(__dirname, '../../views'))

    const response = await request(app)
      .post('/posts/new')
      .field('content', 'Test content')
      .field('trip_id', '1')

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('SELECT posts.*, users.handle'),
      []
    )
  })
})