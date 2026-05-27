import { describe, it, expect } from 'vitest'
import { uid } from './ids'

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

describe('uid', () => {
  it('returns a UUID-shaped string', () => {
    expect(uid()).toMatch(UUID_V4_PATTERN)
  })

  it('returns a different value on every call', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 50; i++) seen.add(uid())
    expect(seen.size).toBe(50)
  })
})
