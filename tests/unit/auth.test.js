const bcrypt = require('bcrypt')

describe('Authentication Unit Tests', () => {
  
  test('should hash passwords correctly', async () => {
    const password = 'testPassword123'
    const hash = await bcrypt.hash(password, 10)
    
    expect(hash).toBeDefined()
    expect(hash).not.toBe(password)
    expect(await bcrypt.compare(password, hash)).toBe(true)
    expect(await bcrypt.compare('wrongPassword', hash)).toBe(false)
  })

  test('should generate unique hashes for same password', async () => {
    const password = 'samePassword'
    const hash1 = await bcrypt.hash(password, 10)
    const hash2 = await bcrypt.hash(password, 10)
    
    expect(hash1).not.toBe(hash2)
    expect(await bcrypt.compare(password, hash1)).toBe(true)
    expect(await bcrypt.compare(password, hash2)).toBe(true)
  })
})