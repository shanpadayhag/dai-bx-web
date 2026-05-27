import { describe, it, expect } from 'vitest'
import { isActiveRun, isLegacyTimerRun } from './types'

const baseIds = { taskId: 't1', groupId: 'g1', timerSetId: 's1' }

describe('isActiveRun', () => {
  it('rejects non-objects', () => {
    expect(isActiveRun(null)).toBe(false)
    expect(isActiveRun(undefined)).toBe(false)
    expect(isActiveRun('running')).toBe(false)
  })

  it('rejects records missing required id fields', () => {
    expect(isActiveRun({ status: 'running', currentIndex: 0, stepStartedAt: '2026' })).toBe(false)
    expect(isActiveRun({ ...baseIds, status: 'running' })).toBe(false)
  })

  it('accepts a well-formed running run', () => {
    expect(
      isActiveRun({
        ...baseIds,
        status: 'running',
        currentIndex: 1,
        stepStartedAt: '2026-05-24T10:00:00Z',
      })
    ).toBe(true)
  })

  it('accepts a well-formed awaitingAdvance run', () => {
    expect(
      isActiveRun({
        ...baseIds,
        status: 'awaitingAdvance',
        completedIndex: 2,
        finishedAt: '2026-05-24T10:05:00Z',
      })
    ).toBe(true)
  })

  it('accepts a well-formed completed run', () => {
    expect(
      isActiveRun({
        ...baseIds,
        status: 'completed',
        finishedAt: '2026-05-24T10:30:00Z',
      })
    ).toBe(true)
  })

  it('rejects unknown status values', () => {
    expect(isActiveRun({ ...baseIds, status: 'paused' })).toBe(false)
  })
})

describe('isLegacyTimerRun', () => {
  it('accepts the legacy idle marker', () => {
    expect(isLegacyTimerRun({ status: 'idle' })).toBe(true)
  })

  it('accepts any ActiveRun shape', () => {
    expect(
      isLegacyTimerRun({
        ...baseIds,
        status: 'running',
        currentIndex: 0,
        stepStartedAt: '2026-05-24T10:00:00Z',
      })
    ).toBe(true)
  })

  it('rejects garbage', () => {
    expect(isLegacyTimerRun(null)).toBe(false)
    expect(isLegacyTimerRun({ status: 'paused' })).toBe(false)
  })
})
