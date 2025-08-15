const request = require('supertest')
const express = require('express')
const session = require('express-session')
const feedRoutes = require('../../routes/feed')
const { requireLogin } = require('../../middleware/requireLogin')

describe('Feed Routes Integration Tests', () => {
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
    app.use('/feed', feedRoutes)
  })

  test('GET /feed/:tripId should return trip feed when authenticated', async () => {
    const mockUser = { id: 1, handle: 'testuser', email: 'test@example.com' }
    const mockTrip = { id: 1, name: 'Test Trip' }
    const mockPosts = [
      {
        id: 1,
        user_id: 1,
        trip_id: 1,
        content: 'First post',
        image_filename: null,
        created_at: new Date(),
        handle: 'testuser',
        avatar_file_name: 'test.png',
        avatar_head_file_name: 'test_head.png'
      }
    ]

    const mockExecute = jest.fn()
      .mockResolvedValueOnce([mockPosts]) // posts query
      .mockResolvedValueOnce([[mockTrip]]) // trip query

    app.use((req, res, next) => {
      req.db.execute = mockExecute
      req.session.user = mockUser
      next()
    })

    const response = await request(app)
      .get('/feed/1')

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('SELECT posts.*, users.handle'),
      ['1']
    )
    expect(mockExecute).toHaveBeenCalledWith(
      'SELECT name, id FROM trips WHERE id = ?',
      ['1']
    )
  })

  test('GET /feed/:tripId should require authentication', async () => {
    const response = await request(app)
      .get('/feed/1')

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/login')
  })

  test('GET /feed/:tripId should return 404 for non-existent trip', async () => {
    const mockUser = { id: 1, handle: 'testuser', email: 'test@example.com' }

    const mockExecute = jest.fn()
      .mockResolvedValueOnce([[]]) // empty posts
      .mockResolvedValueOnce([[]]) // empty trip

    app.use((req, res, next) => {
      req.db.execute = mockExecute
      req.session.user = mockUser
      next()
    })

    const response = await request(app)
      .get('/feed/999')

    expect(response.status).toBe(404)
    expect(mockExecute).toHaveBeenCalledWith(
      'SELECT name, id FROM trips WHERE id = ?',
      ['999']
    )
  })

  test('GET /feed/:tripId should order posts by created_at DESC', async () => {
    const mockUser = { id: 1, handle: 'testuser', email: 'test@example.com' }
    const mockTrip = { id: 1, name: 'Test Trip' }

    const mockExecute = jest.fn()
      .mockResolvedValueOnce([[]]) // posts
      .mockResolvedValueOnce([[mockTrip]]) // trip

    app.use((req, res, next) => {
      req.db.execute = mockExecute
      req.session.user = mockUser
      next()
    })

    await request(app).get('/feed/1')

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY created_at DESC'),
      ['1']
    )
  })

  test('GET /feed/:tripId should join user data with posts', async () => {
    const mockUser = { id: 1, handle: 'testuser', email: 'test@example.com' }
    const mockTrip = { id: 1, name: 'Test Trip' }

    const mockExecute = jest.fn()
      .mockResolvedValueOnce([[]]) // posts
      .mockResolvedValueOnce([[mockTrip]]) // trip

    app.use((req, res, next) => {
      req.db.execute = mockExecute
      req.session.user = mockUser
      next()
    })

    await request(app).get('/feed/1')

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('JOIN users ON posts.user_id = users.id'),
      ['1']
    )
  })
})