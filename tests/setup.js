// Test setup
require('dotenv').config({ path: '.env.test' })

// Mock database for tests
const mockPool = {
  execute: jest.fn(),
  end: jest.fn()
}

global.mockDb = mockPool

beforeEach(() => {
  jest.clearAllMocks()
})