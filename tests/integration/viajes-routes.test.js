const request = require('supertest')
const express = require('express')
const session = require('express-session')
const viajesRoutes = require('../../routes/viajes')

describe('Viajes Routes Integration Tests', () => {
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
    app.use('/viajes', viajesRoutes)
  })

  test('GET /viajes should return trips when authenticated', async () => {
    const mockUser = { id: 1, handle: 'testuser', email: 'test@example.com' }
    const mockTrips = [
      { id: 1, name: 'Brazil 2025', start_date: '2025-01-15' },
      { id: 2, name: 'Argentina 2024', start_date: '2024-12-01' }
    ]

    const mockExecute = jest.fn().mockResolvedValue([mockTrips])

    app.use((req, res, next) => {
      req.db.execute = mockExecute
      req.session.user = mockUser
      next()
    })

    const response = await request(app)
      .get('/viajes')

    expect(mockExecute).toHaveBeenCalledWith(
      'SELECT * FROM trips ORDER BY start_date DESC'
    )
  })

  test('GET /viajes should require authentication', async () => {
    const response = await request(app)
      .get('/viajes')

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/login')
  })

  test('GET /viajes should order trips by start_date DESC', async () => {
    const mockUser = { id: 1, handle: 'testuser', email: 'test@example.com' }
    const mockTrips = [
      { id: 1, name: 'Recent Trip', start_date: '2025-01-15' },
      { id: 2, name: 'Older Trip', start_date: '2024-12-01' }
    ]

    const mockExecute = jest.fn().mockResolvedValue([mockTrips])

    app.use((req, res, next) => {
      req.db.execute = mockExecute
      req.session.user = mockUser
      next()
    })

    await request(app).get('/viajes')

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY start_date DESC')
    )
  })

  test('GET /viajes should handle empty trips list', async () => {
    const mockUser = { id: 1, handle: 'testuser', email: 'test@example.com' }

    const mockExecute = jest.fn().mockResolvedValue([[]])

    app.use((req, res, next) => {
      req.db.execute = mockExecute
      req.session.user = mockUser
      next()
    })

    const response = await request(app)
      .get('/viajes')

    expect(mockExecute).toHaveBeenCalledWith(
      'SELECT * FROM trips ORDER BY start_date DESC'
    )
  })

  test('GET /viajes should pass user and trips to template', async () => {
    const mockUser = { id: 1, handle: 'testuser', email: 'test@example.com' }
    const mockTrips = [
      { id: 1, name: 'Test Trip', start_date: '2025-01-15' }
    ]

    const mockExecute = jest.fn().mockResolvedValue([mockTrips])

    app.use((req, res, next) => {
      req.db.execute = mockExecute
      req.session.user = mockUser
      next()
    })

    // Mock the render function to capture template data
    let renderData = null
    app.use((req, res, next) => {
      const originalRender = res.render
      res.render = function(template, data) {
        renderData = data
        res.status(200).send('OK')
      }
      next()
    })

    await request(app).get('/viajes')

    expect(renderData).toEqual({
      user: mockUser,
      trips: mockTrips
    })
  })
})