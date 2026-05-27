import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'

// Mock the audio lib BEFORE importing the scheduler so the import resolves
// against the mock. The factory returns a stable handle so tests can assert
// against its `stop`.
const stopMock = vi.fn()
vi.mock('~/lib/audio', () => ({
  resolveSound: vi.fn(async () => ({
    source: 'beep' as const,
    play: () => ({ stop: stopMock }),
  })),
}))

import { createAlarmsScheduler, type AlarmsScheduler } from './scheduler'
import { createTasksStore, type TasksStore } from '~/features/tasks/store'
import { createSoundsStore, type SoundsStore } from '~/features/sounds/store'
import type { TaskRow } from '~/features/tasks/types'

const FIXED_NOW = new Date('2026-05-01T12:00:00.000Z')

const row = (overrides: Partial<TaskRow>): TaskRow => ({
  id: 't1',
  groupId: 'g1',
  parentId: null,
  name: 'task',
  order: 0,
  hiddenUntil: null,
  completedDate: null,
  isOpen: true,
  alarm: null,
  timerSets: [],
  activeTimerSetId: null,
  ...overrides,
})

let tasks: TasksStore
let sounds: SoundsStore
let scheduler: AlarmsScheduler | null = null

beforeEach(() => {
  // Fake only the timers — keep microtasks real so fake-indexeddb's internal
  // queueing still flushes during awaited persistence.
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
  stopMock.mockClear()
  tasks = createTasksStore()
  sounds = createSoundsStore()
})

afterEach(() => {
  scheduler?.dispose()
  scheduler = null
  vi.useRealTimers()
})

const start = (): AlarmsScheduler => {
  scheduler = createAlarmsScheduler({ tasks, sounds })
  return scheduler
}

describe('AlarmsScheduler — initial state', () => {
  it('exposes a null firing accessor when there are no alarms', () => {
    const s = start()
    expect(s.firing()).toBeNull()
  })
})

describe('one-shot alarms', () => {
  it('fires once, then disables itself', () => {
    tasks.hydrateFromRows([
      row({
        id: 't1',
        alarm: {
          firesAt: new Date(FIXED_NOW.getTime() + 60_000).toISOString(),
          soundId: null,
          enabled: true,
          repeat: 'none',
        },
      }),
    ])
    const s = start()
    expect(s.firing()).toBeNull()

    vi.advanceTimersByTime(60_000)

    expect(s.firing()?.task.id).toBe('t1')
    const alarm = tasks.tasksFor('g1')[0]?.alarm
    expect(alarm?.enabled).toBe(false)
  })

  it('does not fire again after being disabled (no re-fire on the next tick)', () => {
    tasks.hydrateFromRows([
      row({
        id: 't1',
        alarm: {
          firesAt: new Date(FIXED_NOW.getTime() + 1_000).toISOString(),
          soundId: null,
          enabled: true,
          repeat: 'none',
        },
      }),
    ])
    const s = start()
    vi.advanceTimersByTime(1_000)
    expect(s.firing()?.task.id).toBe('t1')
    s.dismiss()
    expect(s.firing()).toBeNull()

    vi.advanceTimersByTime(10 * 60_000)
    expect(s.firing()).toBeNull()
  })
})

describe('daily alarms', () => {
  it('fires and reschedules to firesAt + 24h', () => {
    const initial = new Date(FIXED_NOW.getTime() + 10_000)
    tasks.hydrateFromRows([
      row({
        id: 't1',
        alarm: {
          firesAt: initial.toISOString(),
          soundId: null,
          enabled: true,
          repeat: 'daily',
        },
      }),
    ])
    const s = start()
    vi.advanceTimersByTime(10_000)
    expect(s.firing()?.task.id).toBe('t1')

    const alarm = tasks.tasksFor('g1')[0]?.alarm
    expect(alarm?.enabled).toBe(true)
    expect(alarm?.repeat).toBe('daily')
    expect(alarm?.firesAt).toBe(new Date(initial.getTime() + 86_400_000).toISOString())
  })

  it('skips already-elapsed daily occurrences when catching up', () => {
    // Alarm originally fired far in the past (e.g. browser was closed for a week).
    // The reschedule loop should advance past every elapsed day until the next
    // future firesAt.
    const longAgo = new Date(FIXED_NOW.getTime() - 7 * 86_400_000 - 60_000)
    tasks.hydrateFromRows([
      row({
        id: 't1',
        alarm: {
          firesAt: longAgo.toISOString(),
          soundId: null,
          enabled: true,
          repeat: 'daily',
        },
      }),
    ])
    const s = start()
    // setTimeout with negative delay fires on the next tick: advance 0ms.
    vi.advanceTimersByTime(0)
    expect(s.firing()?.task.id).toBe('t1')
    const nextAt = Date.parse(tasks.tasksFor('g1')[0]?.alarm?.firesAt ?? '')
    expect(nextAt).toBeGreaterThan(FIXED_NOW.getTime())
  })
})

describe('disabled alarms', () => {
  it('never fire, even when their firesAt is in the past', () => {
    tasks.hydrateFromRows([
      row({
        id: 't1',
        alarm: {
          firesAt: new Date(FIXED_NOW.getTime() + 10_000).toISOString(),
          soundId: null,
          enabled: false,
          repeat: 'none',
        },
      }),
    ])
    const s = start()
    vi.advanceTimersByTime(60_000)
    expect(s.firing()).toBeNull()
  })
})

describe('task lifecycle', () => {
  it('removes a deleted task from the scheduling queue', () => {
    tasks.hydrateFromRows([
      row({
        id: 't1',
        alarm: {
          firesAt: new Date(FIXED_NOW.getTime() + 60_000).toISOString(),
          soundId: null,
          enabled: true,
          repeat: 'none',
        },
      }),
    ])
    const s = start()
    // Simulate deletion by clearing the group's tree synchronously — avoids
    // routing through the IDB persistence path (whose internal timers are
    // faked during this test) while still giving the scheduler memo a state
    // change to react to.
    tasks.clearForGroup('g1')

    vi.advanceTimersByTime(60_000)
    expect(s.firing()).toBeNull()
  })

  it('picks the earliest of multiple alarms', () => {
    tasks.hydrateFromRows([
      row({
        id: 'late',
        order: 0,
        alarm: {
          firesAt: new Date(FIXED_NOW.getTime() + 60_000).toISOString(),
          soundId: null,
          enabled: true,
          repeat: 'none',
        },
      }),
      row({
        id: 'early',
        order: 1,
        alarm: {
          firesAt: new Date(FIXED_NOW.getTime() + 30_000).toISOString(),
          soundId: null,
          enabled: true,
          repeat: 'none',
        },
      }),
    ])
    const s = start()

    vi.advanceTimersByTime(30_000)
    expect(s.firing()?.task.id).toBe('early')
  })

  it('ignores alarms with an unparseable firesAt', () => {
    tasks.hydrateFromRows([
      row({
        id: 'broken',
        alarm: {
          firesAt: 'not-a-real-iso-string',
          soundId: null,
          enabled: true,
          repeat: 'none',
        },
      }),
    ])
    const s = start()
    vi.advanceTimersByTime(60 * 60_000)
    expect(s.firing()).toBeNull()
  })
})

describe('dismiss', () => {
  it('stops the playing sound and clears firing', async () => {
    tasks.hydrateFromRows([
      row({
        id: 't1',
        alarm: {
          firesAt: new Date(FIXED_NOW.getTime() + 1_000).toISOString(),
          soundId: null,
          enabled: true,
          repeat: 'none',
        },
      }),
    ])
    const s = start()
    vi.advanceTimersByTime(1_000)
    // Let the background sound-resolution promise settle.
    await Promise.resolve()
    await Promise.resolve()
    s.dismiss()
    expect(s.firing()).toBeNull()
    expect(stopMock).toHaveBeenCalled()
  })
})
