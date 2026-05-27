/**
 * Timer formatting + ordering helpers. Ported from
 *   client-web-old/.../timers/data-access/timer-format.ts
 */

import type { TimerSet, TimerSpec } from '../types'

const pad = (n: number): string => String(n).padStart(2, '0')

export const totalSetMinutes = (set: TimerSet): number =>
  set.timers.reduce((sum, t) => sum + Math.max(0, t.durationMinutes), 0)

/** Format seconds remaining as a tabular `MM:SS`. Negative → "00:00". */
export const formatRemaining = (remainingSeconds: number): string => {
  const safe = Math.max(0, Math.ceil(remainingSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${pad(minutes)}:${pad(seconds)}`
}

/** "5m → 10m → 15m" style summary used by the badge / readout. */
export const formatSetSummary = (set: TimerSet): string => {
  if (set.timers.length === 0) return 'Empty'
  return set.timers.map((t) => `${t.durationMinutes}m`).join(' → ')
}

export const sortedTimers = (timers: TimerSpec[]): TimerSpec[] =>
  timers.slice().sort((a, b) => a.order - b.order)

export const reindexTimers = (timers: TimerSpec[]): TimerSpec[] =>
  sortedTimers(timers).map((t, i) => ({ ...t, order: i }))

export const sortedSets = (sets: TimerSet[]): TimerSet[] =>
  sets.slice().sort((a, b) => a.order - b.order)

export const reindexSets = (sets: TimerSet[]): TimerSet[] =>
  sortedSets(sets).map((s, i) => ({ ...s, order: i }))
