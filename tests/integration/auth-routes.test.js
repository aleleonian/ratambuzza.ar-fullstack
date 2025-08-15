const request = require('supertest')
const express = require('express')
const session = require('express-session')
const authRoutes = require('../../routes/auth')
const bcrypt = require('bcrypt')

describe('Authentication Routes Integration Tests', () => {
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

    app.use('/', authRoutes)
  })

  test('POST /login should authenticate valid user', async () => {
    const mockUser = {
      id: 1,
      handle: 'testuser',
      email: 'test@example.com',
      password_hash: await bcrypt.hash('password123', 10)
    }

    const mockExecute = jest.fn().mockResolvedValue([[mockUser]])
    
    app.use((req, res, next) => {
      req.db.execute = mockExecute
      next()
    })

    const response = await request(app)
      .post('/login')
      .send({
        handle: 'testuser',
        password: 'password123'
      })

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/')
    expect(mockExecute).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE handle = ?',
      ['testuser']
    )
  })

  test('POST /login should reject invalid credentials', async () => {
    const mockExecute = jest.fn().mockResolvedValue([[]])
    
    app.use((req, res, next) => {
      req.db.execute = mockExecute
      next()
    })

    app.set('view engine', 'ejs')
    app.set('views', './views')

    const response = await request(app)
      .post('/login')
      .send({
        handle: 'nonexistent',
        password: 'wrongpassword'
      })

    expect(mockExecute).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE handle = ?',
      ['nonexistent']
    )
  })

  test('POST /signup should create new user', async () => {
    const mockExecute = jest.fn().mockResolvedValue({})

    app.use((req, res, next) => {
      req.db.execute = mockExecute
      next()
    })

    const response = await request(app)
      .post('/signup')
      .send({
        email: 'newuser@example.com',
        password: 'newpassword123',
        handle: 'newuser'
      })

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/login')
    expect(mockExecute).toHaveBeenCalledWith(
      'INSERT INTO users (email, password_hash, handle) VALUES (?, ?, ?)',
      expect.arrayContaining([
        'newuser@example.com',
        expect.any(String), // hashed password
        'newuser'
      ])
    )
  })

  test('GET /logout should destroy session', async () => {
    const response = await request(app)
      .get('/logout')

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/')
  })

  test('POST /login should handle safe redirects', async () => {
    const mockUser = {
      id: 1,
      handle: 'testuser',
      email: 'test@example.com',
      password_hash: await bcrypt.hash('password123', 10)
    }

    const mockExecute = jest.fn().mockResolvedValue([[mockUser]])
    
    app.use((req, res, next) => {
      req.db.execute = mockExecute
      req.session.redirectTo = '/viajes'
      next()
    })

    const response = await request(app)
      .post('/login')
      .send({
        handle: 'testuser',
        password: 'password123'
      })

    expect(response.status).toBe(302)
    expect(response.headers.location).toBe('/viajes')
  })
})