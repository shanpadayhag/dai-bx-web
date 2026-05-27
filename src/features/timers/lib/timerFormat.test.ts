import { describe, it, expect } from 'vitest'
import {
  formatRemaining,
  formatSetSummary,
  reindexSets,
  reindexTimers,
  sortedSets,
  sortedTimers,
  totalSetMinutes,
} from './timerFormat'
import type { TimerSet, TimerSpec } from '../types'

const spec = (id: string, durationMinutes: number, order: number): TimerSpec => ({
  id,
  durationMinutes,
  order,
})

const set = (id: string, order: number, timers: TimerSpec[]): TimerSet => ({
  id,
  name: id,
  order,
  autoAdvance: false,
  soundId: null,
  timers,
})

describe('totalSetMinutes', () => {
  it('sums step durations, treating negatives as zero', () => {
    expect(
      totalSetMinutes(set('s', 0, [spec('a', 5, 0), spec('b', 10, 1), spec('c', -3, 2)])),
    ).toBe(15)
  })

  it('is 0 for an empty set', () => {
    expect(totalSetMinutes(set('s', 0, []))).toBe(0)
  })
})

describe('formatRemaining', () => {
  it('zero-pads minutes and seconds, ceils fractional', () => {
    expect(formatRemaining(0)).toBe('00:00')
    expect(formatRemaining(59)).toBe('00:59')
    expect(formatRemaining(60)).toBe('01:00')
    expect(formatRemaining(125)).toBe('02:05')
    expect(formatRemaining(125.4)).toBe('02:06')
  })

  it('clamps negative values to 00:00', () => {
    expect(formatRemaining(-5)).toBe('00:00')
  })
})

describe('formatSetSummary', () => {
  it('joins step durations with an arrow separator', () => {
    expect(
      formatSetSummary(set('s', 0, [spec('a', 5, 0), spec('b', 10, 1), spec('c', 15, 2)])),
    ).toBe('5m → 10m → 15m')
  })

  it('returns "Empty" for sets with no steps', () => {
    expect(formatSetSummary(set('s', 0, []))).toBe('Empty')
  })
})

describe('sortedTimers / reindexTimers', () => {
  it('sortedTimers sorts by order without mutating input', () => {
    const input = [spec('a', 5, 2), spec('b', 5, 0), spec('c', 5, 1)]
    const result = sortedTimers(input)
    expect(result.map((t) => t.id)).toEqual(['b', 'c', 'a'])
    expect(input.map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('reindexTimers writes 0..N-1 in sorted order', () => {
    // Input orders: a=7, b=3, c=100. Sorted: b(3), a(7), c(100). Reindexed: 0,1,2.
    const result = reindexTimers([spec('a', 5, 7), spec('b', 5, 3), spec('c', 5, 100)])
    expect(result.map((t) => [t.id, t.order])).toEqual([['b', 0], ['a', 1], ['c', 2]])
  })
})

describe('sortedSets / reindexSets', () => {
  it('sortedSets sorts by order', () => {
    const result = sortedSets([set('a', 2, []), set('b', 0, []), set('c', 1, [])])
    expect(result.map((s) => s.id)).toEqual(['b', 'c', 'a'])
  })

  it('reindexSets writes 0..N-1', () => {
    const result = reindexSets([set('a', 5, []), set('b', 9, [])])
    expect(result.map((s) => [s.id, s.order])).toEqual([['a', 0], ['b', 1]])
  })
})
