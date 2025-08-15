const { requireLogin } = require('../../middleware/requireLogin')

describe('Middleware Unit Tests', () => {
  
  test('requireLogin should allow authenticated users', () => {
    const req = {
      session: { user: { id: 1, handle: 'testuser' } },
      originalUrl: '/protected'
    }
    const res = {}
    const next = jest.fn()

    requireLogin(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith()
  })

  test('requireLogin should redirect unauthenticated users', () => {
    const req = {
      session: {},
      originalUrl: '/protected'
    }
    const res = {
      redirect: jest.fn()
    }
    const next = jest.fn()

    requireLogin(req, res, next)

    expect(res.redirect).toHaveBeenCalledWith('/login')
    expect(req.session.redirectTo).toBe('/protected')
    expect(next).not.toHaveBeenCalled()
  })

  test('requireLogin should handle missing session', () => {
    const req = {
      originalUrl: '/protected'
    }
    const res = {
      redirect: jest.fn()
    }
    const next = jest.fn()

    requireLogin(req, res, next)

    expect(res.redirect).toHaveBeenCalledWith('/login')
    expect(next).not.toHaveBeenCalled()
  })
})