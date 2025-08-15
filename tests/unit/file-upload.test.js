const path = require('path')
const multer = require('multer')

describe('File Upload Unit Tests', () => {
  
  test('should generate unique filenames', () => {
    const originalDateNow = Date.now
    const originalMathRandom = Math.random

    Date.now = jest.fn(() => 1234567890)
    Math.random = jest.fn(() => 0.5)

    const uploadDir = path.join(__dirname, '../../public/uploads')
    const storage = multer.diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`
        cb(null, uniqueName)
      }
    })

    const mockReq = {}
    const mockFile = { originalname: 'test.jpg' }
    const mockCallback = jest.fn()

    storage.filename(mockReq, mockFile, mockCallback)

    expect(mockCallback).toHaveBeenCalledWith(null, '1234567890-500000.jpg')

    Date.now = originalDateNow
    Math.random = originalMathRandom
  })

  test('should extract file extension correctly', () => {
    const testCases = [
      { filename: 'image.jpg', expected: '.jpg' },
      { filename: 'photo.PNG', expected: '.PNG' },
      { filename: 'document.pdf', expected: '.pdf' },
      { filename: 'noextension', expected: '' }
    ]

    testCases.forEach(({ filename, expected }) => {
      expect(path.extname(filename)).toBe(expected)
    })
  })

  test('should handle filename generation with different extensions', () => {
    const extensions = ['.jpg', '.png', '.gif', '.webp']
    const uploadDir = path.join(__dirname, '../../public/uploads')
    
    extensions.forEach(ext => {
      const storage = multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const fileExt = path.extname(file.originalname)
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${fileExt}`
          cb(null, uniqueName)
        }
      })

      const mockFile = { originalname: `test${ext}` }
      const mockCallback = jest.fn()

      storage.filename({}, mockFile, mockCallback)

      expect(mockCallback).toHaveBeenCalledWith(null, expect.stringContaining(ext))
    })
  })
})