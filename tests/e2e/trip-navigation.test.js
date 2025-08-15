const puppeteer = require('puppeteer')

describe('Trip Navigation E2E Tests', () => {
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
    
    const mockTrips = [
      { id: 1, name: 'Brazil 2025', start_date: '2025-01-15' },
      { id: 2, name: 'Argentina 2024', start_date: '2024-12-01' }
    ]
    
    const mockPosts = [
      {
        id: 1,
        user_id: 1,
        trip_id: 1,
        content: 'First post in Brazil trip',
        handle: 'testuser',
        avatar_head_file_name: 'test.png'
      },
      {
        id: 2,
        user_id: 1,
        trip_id: 1,
        content: 'Second post in Brazil trip',
        handle: 'testuser',
        avatar_head_file_name: 'test.png'
      }
    ]
    
    app.use((req, res, next) => {
      req.db = {
        execute: jest.fn().mockImplementation((query, params) => {
          if (query.includes('SELECT * FROM trips')) {
            return Promise.resolve([mockTrips])
          }
          if (query.includes('SELECT posts.*') && params[0] === '1') {
            return Promise.resolve([mockPosts])
          }
          if (query.includes('SELECT name, id FROM trips WHERE id = ?')) {
            const trip = mockTrips.find(t => t.id === parseInt(params[0]))
            return Promise.resolve(trip ? [[trip]] : [[]])
          }
          return Promise.resolve([])
        })
      }
      next()
    })
    
    app.set('view engine', 'ejs')
    app.set('views', './views')
    
    // Mock authentication
    app.use((req, res, next) => {
      req.session.user = { id: 1, handle: 'testuser', email: 'test@example.com' }
      next()
    })
    
    // Mock home route
    app.get('/', (req, res) => {
      res.send(`
        <div id="home">
          <h1>Welcome to Ratambuzza</h1>
          <nav>
            <a href="/viajes" id="trips-link">View Trips</a>
          </nav>
        </div>
      `)
    })
    
    // Mock trips listing route
    app.get('/viajes', async (req, res) => {
      const [trips] = await req.db.execute('SELECT * FROM trips ORDER BY start_date DESC')
      
      const tripsList = trips.map(trip => 
        `<div class="trip" data-trip-id="${trip.id}">
          <h3>${trip.name}</h3>
          <p>Start: ${trip.start_date}</p>
          <a href="/feed/${trip.id}" class="trip-link">View Feed</a>
        </div>`
      ).join('')
      
      res.send(`
        <div id="trips">
          <h1>Your Trips</h1>
          ${tripsList}
        </div>
      `)
    })
    
    // Mock feed route
    app.get('/feed/:tripId', async (req, res) => {
      const tripId = req.params.tripId
      
      const [posts] = await req.db.execute(
        'SELECT posts.*, users.handle FROM posts JOIN users ON posts.user_id = users.id WHERE trip_id = ?',
        [tripId]
      )
      
      const [tripRows] = await req.db.execute(
        'SELECT name, id FROM trips WHERE id = ?',
        [tripId]
      )
      
      if (tripRows.length === 0) {
        return res.status(404).send('<div id="error">Trip not found</div>')
      }
      
      const trip = tripRows[0]
      const postsList = posts.map(post => 
        `<div class="post" data-post-id="${post.id}">
          <strong>${post.handle}:</strong> ${post.content}
        </div>`
      ).join('')
      
      res.send(`
        <div id="trip-feed">
          <h1>${trip.name} Feed</h1>
          <nav>
            <a href="/viajes" id="back-to-trips">← Back to Trips</a>
          </nav>
          <div id="posts">${postsList}</div>
        </div>
      `)
    })
    
    server = app.listen(3003)
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

  test('should navigate from home to trips list', async () => {
    await page.goto('http://localhost:3003/')
    
    // Click on trips link
    await page.click('#trips-link')
    
    // Wait for trips page to load
    await page.waitForSelector('#trips', { timeout: 5000 })
    
    // Verify trips are displayed
    const tripElements = await page.$$('.trip')
    expect(tripElements.length).toBe(2)
    
    const tripNames = await page.$$eval('.trip h3', elements => 
      elements.map(el => el.textContent)
    )
    
    expect(tripNames).toContain('Brazil 2025')
    expect(tripNames).toContain('Argentina 2024')
  })

  test('should navigate from trips list to specific trip feed', async () => {
    await page.goto('http://localhost:3003/viajes')
    
    // Click on first trip's feed link
    await page.click('.trip-link')
    
    // Wait for feed page to load
    await page.waitForSelector('#trip-feed', { timeout: 5000 })
    
    // Verify we're on the correct trip feed
    const feedTitle = await page.$eval('#trip-feed h1', el => el.textContent)
    expect(feedTitle).toBe('Brazil 2025 Feed')
    
    // Verify posts are displayed
    const posts = await page.$$eval('.post', elements => 
      elements.map(el => el.textContent)
    )
    
    expect(posts).toContain('testuser: First post in Brazil trip')
    expect(posts).toContain('testuser: Second post in Brazil trip')
  })

  test('should navigate back from trip feed to trips list', async () => {
    await page.goto('http://localhost:3003/feed/1')
    
    // Click back to trips link
    await page.click('#back-to-trips')
    
    // Wait for trips page to load
    await page.waitForSelector('#trips', { timeout: 5000 })
    
    // Verify we're back on trips page
    const pageTitle = await page.$eval('#trips h1', el => el.textContent)
    expect(pageTitle).toBe('Your Trips')
  })

  test('should handle non-existent trip gracefully', async () => {
    await page.goto('http://localhost:3003/feed/999')
    
    // Wait for error message
    await page.waitForSelector('#error', { timeout: 5000 })
    
    const errorText = await page.$eval('#error', el => el.textContent)
    expect(errorText).toBe('Trip not found')
  })

  test('should display trips in correct order (newest first)', async () => {
    await page.goto('http://localhost:3003/viajes')
    
    await page.waitForSelector('.trip', { timeout: 5000 })
    
    const tripNames = await page.$$eval('.trip h3', elements => 
      elements.map(el => el.textContent)
    )
    
    // Trips should be ordered by start_date DESC
    expect(tripNames[0]).toBe('Brazil 2025') // 2025-01-15 (newer)
    expect(tripNames[1]).toBe('Argentina 2024') // 2024-12-01 (older)
  })
})