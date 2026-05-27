import { describe, it, expect } from 'vitest'
import {
  formatAlarmTime,
  isTomorrow,
  nextOccurrenceIso,
  parseHourMinute,
  toTimeInputValue,
} from './alarmFormat'

// Fixed reference so locale string formatting stays stable inside tests.
const NOW = new Date(2026, 4, 15, 10, 0, 0) // Fri 2026-05-15 10:00 local

describe('formatAlarmTime', () => {
  it('returns time only for today', () => {
    const iso = new Date(2026, 4, 15, 14, 30).toISOString()
    expect(formatAlarmTime(iso, NOW)).toMatch(/2:30/)
  })

  it('labels Tomorrow', () => {
    const iso = new Date(2026, 4, 16, 9, 0).toISOString()
    expect(formatAlarmTime(iso, NOW).toLowerCase()).toContain('tomorrow')
  })

  it('labels Yesterday', () => {
    const iso = new Date(2026, 4, 14, 9, 0).toISOString()
    expect(formatAlarmTime(iso, NOW).toLowerCase()).toContain('yesterday')
  })

  it('returns empty string for invalid input', () => {
    expect(formatAlarmTime('garbage', NOW)).toBe('')
  })
})

describe('toTimeInputValue', () => {
  it('returns HH:MM in local time', () => {
    const iso = new Date(2026, 4, 15, 5, 7).toISOString()
    expect(toTimeInputValue(iso)).toBe('05:07')
  })

  it('returns empty string for null or invalid', () => {
    expect(toTimeInputValue(null)).toBe('')
    expect(toTimeInputValue('nope')).toBe('')
  })
})

describe('nextOccurrenceIso', () => {
  it('returns today when the time has not passed yet', () => {
    const now = new Date(2026, 4, 15, 10, 0, 0)
    const iso = nextOccurrenceIso(14, 30, now)
    const d = new Date(iso)
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(14)
    expect(d.getMinutes()).toBe(30)
  })

  it('returns tomorrow when the time has passed', () => {
    const now = new Date(2026, 4, 15, 23, 0, 0)
    const iso = nextOccurrenceIso(8, 0, now)
    const d = new Date(iso)
    expect(d.getDate()).toBe(16)
    expect(d.getHours()).toBe(8)
  })
})

describe('parseHourMinute', () => {
  it('returns local hour/minute for a valid ISO', () => {
    const iso = new Date(2026, 4, 15, 22, 5).toISOString()
    expect(parseHourMinute(iso)).toEqual({ hour: 22, minute: 5 })
  })

  it('returns null for null/invalid', () => {
    expect(parseHourMinute(null)).toBeNull()
    expect(parseHourMinute('x')).toBeNull()
  })
})

describe('isTomorrow', () => {
  it('detects an ISO whose local date is one day ahead', () => {
    const iso = new Date(2026, 4, 16, 8, 0).toISOString()
    expect(isTomorrow(iso, NOW)).toBe(true)
  })

  it('returns false for today', () => {
    const iso = new Date(2026, 4, 15, 18, 0).toISOString()
    expect(isTomorrow(iso, NOW)).toBe(false)
  })

  it('returns false for invalid', () => {
    expect(isTomorrow('x', NOW)).toBe(false)
  })
})
