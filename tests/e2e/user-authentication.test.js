const puppeteer = require('puppeteer')
const bcrypt = require('bcrypt')

describe('User Authentication E2E Tests', () => {
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
    const app = express()
    
    app.use(express.urlencoded({ extended: true }))
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false
    }))
    
    // Mock database with test user
    const testUser = {
      id: 1,
      handle: 'testuser',
      email: 'test@example.com',
      password_hash: await bcrypt.hash('password123', 10)
    }
    
    app.use((req, res, next) => {
      req.db = {
        execute: jest.fn().mockImplementation((query, params) => {
          if (query.includes('SELECT * FROM users WHERE handle = ?')) {
            if (params[0] === 'testuser') {
              return Promise.resolve([[testUser]])
            }
            return Promise.resolve([[]])
          }
          return Promise.resolve([])
        })
      }
      res.locals.user = req.session.user
      next()
    })
    
    app.set('view engine', 'ejs')
    app.set('views', './views')
    
    // Mock routes
    app.get('/login', (req, res) => {
      res.send(`
        <form method="POST" action="/login">
          <input name="handle" type="text" placeholder="Handle" />
          <input name="password" type="password" placeholder="Password" />
          <button type="submit">Login</button>
        </form>
      `)
    })
    
    app.post('/login', async (req, res) => {
      const { handle, password } = req.body
      const [rows] = await req.db.execute('SELECT * FROM users WHERE handle = ?', [handle])
      const user = rows[0]
      
      if (!user) {
        return res.send('<div id="error">Invalid credentials</div>')
      }
      
      const match = await bcrypt.compare(password, user.password_hash)
      if (!match) {
        return res.send('<div id="error">Invalid credentials</div>')
      }
      
      req.session.user = { id: user.id, handle: user.handle, email: user.email }
      res.redirect('/')
    })
    
    app.get('/', (req, res) => {
      if (req.session.user) {
        res.send(`<div id="welcome">Welcome, ${req.session.user.handle}!</div>`)
      } else {
        res.send('<div id="home">Home Page</div>')
      }
    })
    
    server = app.listen(3001)
  })

  afterAll(async () => {
    await browser.close()
    server.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
  })

  afterEach(async () => {
    await page.close()
  })

  test('should complete full login workflow', async () => {
    // Navigate to login page
    await page.goto('http://localhost:3001/login')
    
    // Fill login form
    await page.type('input[name="handle"]', 'testuser')
    await page.type('input[name="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for redirect and check welcome message
    await page.waitForSelector('#welcome', { timeout: 5000 })
    const welcomeText = await page.$eval('#welcome', el => el.textContent)
    
    expect(welcomeText).toBe('Welcome, testuser!')
  })

  test('should show error for invalid credentials', async () => {
    await page.goto('http://localhost:3001/login')
    
    await page.type('input[name="handle"]', 'wronguser')
    await page.type('input[name="password"]', 'wrongpassword')
    
    await page.click('button[type="submit"]')
    
    await page.waitForSelector('#error', { timeout: 5000 })
    const errorText = await page.$eval('#error', el => el.textContent)
    
    expect(errorText).toBe('Invalid credentials')
  })

  test('should prevent access to protected routes when not logged in', async () => {
    // Try to access home page without logging in
    await page.goto('http://localhost:3001/')
    
    const homeText = await page.$eval('#home', el => el.textContent)
    expect(homeText).toBe('Home Page')
    
    // No welcome message should be present
    const welcomeElement = await page.$('#welcome')
    expect(welcomeElement).toBeNull()
  })
})