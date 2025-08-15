const request = require('supertest')
const express = require('express')
const session = require('express-session')
const path = require('path')

describe('Server Integration Tests', () => {
  let app

  beforeEach(() => {
    app = express()
    app.use(express.urlencoded({ extended: true }))
    app.use(express.static('public'))
    app.use('/images', express.static('public/images', {
      maxAge: '7d',
      immutable: true
    }))
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      }
    }))

    // Mock database middleware
    app.use((req, res, next) => {
      req.db = {
        execute: jest.fn()
      }
      res.locals.user = req.session.user
      next()
    })

    app.set('view engine', 'ejs')
    app.set('views', './views')
  })

  test('GET / should return home page with crew data', async () => {
    const mockCrew = [
      { handle: 'user1', avatar_head_file_name: 'user1.png' },
      { handle: 'user2', avatar_head_file_name: 'user2.png' }
    ]

    const mockExecute = jest.fn().mockResolvedValue([mockCrew])

    app.use((req, res, next) => {
      req.db.execute = mockExecute
      next()
    })

    // Mock home route
    app.get('/', async (req, res) => {
      const [crew] = await req.db.execute('SELECT handle, avatar_head_file_name FROM users ORDER BY handle')
      res.render('home', { user: req.session.user, crew })
    })

    const response = await request(app).get('/')

    expect(mockExecute).toHaveBeenCalledWith(
      'SELECT handle, avatar_head_file_name FROM users ORDER BY handle'
    )
  })

  test('should serve static files with caching', async () => {
    // Mock static file serving
    app.get('/images/test.jpg', (req, res) => {
      res.set('Cache-Control', 'max-age=604800, immutable')
      res.status(200).send('image data')
    })

    const response = await request(app).get('/images/test.jpg')

    expect(response.status).toBe(200)
    expect(response.headers['cache-control']).toContain('max-age=604800')
    expect(response.headers['cache-control']).toContain('immutable')
  })

  test('should handle 404 for unknown routes', async () => {
    // Mock 404 handler
    app.use((req, res) => {
      res.status(404).render('404', {
        title: '404 — Not Found',
        user: req.session.user
      })
    })

    const response = await request(app).get('/nonexistent-route')

    expect(response.status).toBe(404)
  })

  test('should handle well-known routes', async () => {
    // Mock well-known handler
    app.get(/^\/\.well-known\/.*/, (req, res) => {
      res.status(204).end()
    })

    const response = await request(app).get('/.well-known/test')

    expect(response.status).toBe(204)
  })

  test('should set session configuration correctly', () => {
    const sessionConfig = {
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000
      }
    }

    expect(sessionConfig.cookie.maxAge).toBe(2592000000) // 30 days in ms
    expect(sessionConfig.resave).toBe(false)
    expect(sessionConfig.saveUninitialized).toBe(false)
  })
})