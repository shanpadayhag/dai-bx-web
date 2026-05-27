import { describe, it, expect } from 'vitest'
import { normalizeAlarm } from './types'

describe('normalizeAlarm', () => {
  it('returns null for non-objects', () => {
    expect(normalizeAlarm(null)).toBeNull()
    expect(normalizeAlarm(undefined)).toBeNull()
    expect(normalizeAlarm('alarm')).toBeNull()
    expect(normalizeAlarm(42)).toBeNull()
  })

  it('returns null when firesAt is missing or non-string', () => {
    expect(normalizeAlarm({ enabled: true })).toBeNull()
    expect(normalizeAlarm({ firesAt: 123 })).toBeNull()
  })

  it('defaults enabled to true when missing or non-boolean', () => {
    expect(normalizeAlarm({ firesAt: '2026-05-24T10:00:00.000Z' })).toEqual({
      firesAt: '2026-05-24T10:00:00.000Z',
      soundId: null,
      enabled: true,
      repeat: 'none',
    })
    expect(
      normalizeAlarm({ firesAt: '2026-05-24T10:00:00.000Z', enabled: 'yes' })
    ).toEqual({
      firesAt: '2026-05-24T10:00:00.000Z',
      soundId: null,
      enabled: true,
      repeat: 'none',
    })
  })

  it('defaults soundId to null when missing or non-string', () => {
    expect(
      normalizeAlarm({ firesAt: '2026-05-24T10:00:00.000Z', soundId: 99 })
    ).toEqual({
      firesAt: '2026-05-24T10:00:00.000Z',
      soundId: null,
      enabled: true,
      repeat: 'none',
    })
  })

  it('normalizes repeat to "daily" only when literally "daily"', () => {
    expect(
      normalizeAlarm({ firesAt: '2026-05-24T10:00:00.000Z', repeat: 'daily' })!.repeat
    ).toBe('daily')
    expect(
      normalizeAlarm({ firesAt: '2026-05-24T10:00:00.000Z', repeat: 'weekly' })!.repeat
    ).toBe('none')
    expect(
      normalizeAlarm({ firesAt: '2026-05-24T10:00:00.000Z' })!.repeat
    ).toBe('none')
  })

  it('passes through a fully valid record verbatim', () => {
    const raw = {
      firesAt: '2026-05-24T10:00:00.000Z',
      soundId: 'sound-1',
      enabled: false,
      repeat: 'daily',
    }
    expect(normalizeAlarm(raw)).toEqual(raw)
  })
})
