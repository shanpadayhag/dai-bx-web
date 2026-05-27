import { describe, it, expect } from 'vitest'
import { dateToLocalIso, todayIso } from './date'

describe('dateToLocalIso', () => {
  it('zero-pads single-digit month and day', () => {
    expect(dateToLocalIso(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('returns the local end-of-year date', () => {
    expect(dateToLocalIso(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31')
  })

  it('returns the local calendar date for a local-midnight instant', () => {
    expect(dateToLocalIso(new Date(2026, 4, 14, 0, 0, 0))).toBe('2026-05-14')
  })
})

describe('todayIso', () => {
  it('matches the current local year/month/day from new Date()', () => {
    const now = new Date()
    const expected =
      `${now.getFullYear()}-` +
      `${String(now.getMonth() + 1).padStart(2, '0')}-` +
      `${String(now.getDate()).padStart(2, '0')}`
    expect(todayIso()).toBe(expected)
  })
})
