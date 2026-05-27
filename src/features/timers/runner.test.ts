import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'

// Mock audio BEFORE importing the runner. `vi.hoisted` is needed because
// the `vi.mock` factory is hoisted above all imports; without it the mock
// can't capture references declared below.
const { stopMock, resolveSoundMock } = vi.hoisted(() => ({
  stopMock: vi.fn(),
  resolveSoundMock: vi.fn(),
}))
vi.mock('~/lib/audio', () => ({
  resolveSound: resolveSoundMock,
}))

import { createTimersRunner, type TimersRunner } from './runner'
import { createTasksStore, type TasksStore } from '~/features/tasks/store'
import { createSoundsStore, type SoundsStore } from '~/features/sounds/store'
import type { TaskRow } from '~/features/tasks/types'
import type { TimerSet } from './types'

const FIXED_NOW = new Date('2026-05-01T12:00:00.000Z')

const oneStepSet = (
  id: string,
  durationMinutes: number,
  opts: { autoAdvance?: boolean; soundId?: string | null } = {},
): TimerSet => ({
  id,
  name: id,
  order: 0,
  autoAdvance: opts.autoAdvance ?? false,
  soundId: opts.soundId ?? null,
  timers: [{ id: `${id}-step0`, durationMinutes, order: 0 }],
})

const multiStepSet = (
  id: string,
  durations: number[],
  opts: { autoAdvance?: boolean } = {},
): TimerSet => ({
  id,
  name: id,
  order: 0,
  autoAdvance: opts.autoAdvance ?? false,
  soundId: null,
  timers: durations.map((d, i) => ({ id: `${id}-step${i}`, durationMinutes: d, order: i })),
})

const taskRow = (
  id: string,
  timerSets: TimerSet[],
  overrides: Partial<TaskRow> = {},
): TaskRow => ({
  id,
  groupId: 'g1',
  parentId: null,
  name: id,
  order: 0,
  hiddenUntil: null,
  completedDate: null,
  isOpen: true,
  alarm: null,
  timerSets,
  activeTimerSetId: timerSets[0]?.id ?? null,
  ...overrides,
})

let tasks: TasksStore
let sounds: SoundsStore
let runner: TimersRunner | null = null

beforeEach(async () => {
  localStorage.clear()
  stopMock.mockClear()
  resolveSoundMock.mockReset()
  resolveSoundMock.mockResolvedValue({
    source: 'beep' as const,
    play: () => ({ stop: stopMock }),
  })
  // Load tasks under REAL timers — fake-indexeddb uses internal timers that
  // vi.useFakeTimers would block.
  tasks = createTasksStore()
  sounds = createSoundsStore()
  await tasks.load()
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  runner?.dispose()
  runner = null
  vi.useRealTimers()
  localStorage.clear()
})

const startRunner = (): TimersRunner => {
  runner = createTimersRunner({ tasks, sounds })
  return runner
}

describe('start', () => {
  it('creates a running run at step 0', () => {
    tasks.hydrateFromRows([taskRow('t1', [oneStepSet('s1', 5)])])
    const r = startRunner()
    r.start('g1', 't1', 's1')

    const run = r.runForTask('t1')
    expect(run?.status).toBe('running')
    if (run?.status === 'running') {
      expect(run.currentIndex).toBe(0)
      expect(run.timerSetId).toBe('s1')
    }
  })

  it('ignores start on an empty timer set', () => {
    tasks.hydrateFromRows([taskRow('t1', [multiStepSet('s1', [])])])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    expect(r.runForTask('t1')).toBeNull()
  })

  it('ignores start when the task does not exist', () => {
    const r = startRunner()
    r.start('g1', 'missing', 's1')
    expect(r.runForTask('missing')).toBeNull()
  })
})

describe('step elapse — manual advance set', () => {
  it('transitions to awaitingAdvance on non-last step', () => {
    tasks.hydrateFromRows([taskRow('t1', [multiStepSet('s1', [1, 2])])])
    const r = startRunner()
    r.start('g1', 't1', 's1')

    vi.advanceTimersByTime(60_000) // first step is 1 minute

    const run = r.runForTask('t1')
    expect(run?.status).toBe('awaitingAdvance')
    if (run?.status === 'awaitingAdvance') {
      expect(run.completedIndex).toBe(0)
    }
  })

  it('transitions to completed on the LAST step (even without auto-advance)', () => {
    tasks.hydrateFromRows([taskRow('t1', [oneStepSet('s1', 1)])])
    const r = startRunner()
    r.start('g1', 't1', 's1')

    vi.advanceTimersByTime(60_000)
    expect(r.runForTask('t1')?.status).toBe('completed')
  })
})

describe('step elapse — auto-advance set', () => {
  it('jumps to the next step automatically when not the last', () => {
    tasks.hydrateFromRows([
      taskRow('t1', [multiStepSet('s1', [1, 2], { autoAdvance: true })]),
    ])
    const r = startRunner()
    r.start('g1', 't1', 's1')

    vi.advanceTimersByTime(60_000) // step 0 elapses
    const run = r.runForTask('t1')
    expect(run?.status).toBe('running')
    if (run?.status === 'running') {
      expect(run.currentIndex).toBe(1)
    }
  })

  it('completes after the last step elapses', () => {
    tasks.hydrateFromRows([
      taskRow('t1', [multiStepSet('s1', [1, 1], { autoAdvance: true })]),
    ])
    const r = startRunner()
    r.start('g1', 't1', 's1')

    vi.advanceTimersByTime(60_000 * 2) // both steps elapse
    expect(r.runForTask('t1')?.status).toBe('completed')
  })

  // Regression: the auto-advance branch used to skip `playForRun` on the
  // theory that "the cadence is the cadence". In practice users can't tell
  // intermediate steps elapsed without an audible cue. Every step end has
  // to ring — completed, awaitingAdvance, AND auto-advance transitions.
  it('rings the sound on every step end, including auto-advance transitions', () => {
    tasks.hydrateFromRows([
      taskRow('t1', [multiStepSet('s1', [1, 1, 1], { autoAdvance: true })]),
    ])
    const r = startRunner()
    r.start('g1', 't1', 's1')

    vi.advanceTimersByTime(60_000) // step 0 elapses → auto-advance to step 1
    expect(resolveSoundMock).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(60_000) // step 1 elapses → auto-advance to step 2
    expect(resolveSoundMock).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(60_000) // step 2 elapses → completed
    expect(resolveSoundMock).toHaveBeenCalledTimes(3)
  })

})

describe('silence + isRinging', () => {
  it('isRinging flips true once the resolved sound attaches and false when silenced', async () => {
    tasks.hydrateFromRows([taskRow('t1', [oneStepSet('s1', 1)])])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    expect(r.isRinging('t1')).toBe(false)

    await vi.advanceTimersByTimeAsync(60_000) // step elapses, completion ring starts
    expect(r.isRinging('t1')).toBe(true)

    r.silence('t1')
    expect(r.isRinging('t1')).toBe(false)
  })

  it('silence stops the ring without dismissing the run', async () => {
    tasks.hydrateFromRows([taskRow('t1', [oneStepSet('s1', 1)])])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(r.runForTask('t1')?.status).toBe('completed')

    r.silence('t1')
    expect(stopMock).toHaveBeenCalled()
    // Run stays in completed state — silence only stops audio.
    expect(r.runForTask('t1')?.status).toBe('completed')
  })

  it('cancel and dismiss also flip isRinging false', async () => {
    tasks.hydrateFromRows([taskRow('t1', [oneStepSet('s1', 1)])])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    await vi.advanceTimersByTimeAsync(60_000)
    expect(r.isRinging('t1')).toBe(true)

    r.dismiss('t1')
    expect(r.isRinging('t1')).toBe(false)
  })

  // Regression: during an auto-advance multi-step run, the ring from a
  // just-elapsed step plays during the *next* step (state = running). The
  // banner has to appear for that case or the user has no UI affordance
  // to silence it. attentionRuns includes running-while-ringing for this
  // reason.
  it('includes running-while-ringing runs in attentionRuns so the banner surfaces a Silence affordance', async () => {
    tasks.hydrateFromRows([
      taskRow('t1', [multiStepSet('s1', [1, 5], { autoAdvance: true })]),
    ])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    expect(r.attentionRuns()).toHaveLength(0)

    // Step 0 elapses → auto-advance to step 1 → ring kicks in during step 1.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(r.runForTask('t1')?.status).toBe('running')
    expect(r.isRinging('t1')).toBe(true)
    expect(r.attentionRuns()).toHaveLength(1)
    expect(r.attentionRuns()[0]?.taskId).toBe('t1')

    // User clicks Silence → ring stops → run is no longer in attention
    // (running + not ringing).
    r.silence('t1')
    expect(r.attentionRuns()).toHaveLength(0)
  })
})

describe('advance', () => {
  it('moves from awaitingAdvance into the next step', () => {
    tasks.hydrateFromRows([taskRow('t1', [multiStepSet('s1', [1, 1])])])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    vi.advanceTimersByTime(60_000)
    r.advance('t1')

    const run = r.runForTask('t1')
    expect(run?.status).toBe('running')
    if (run?.status === 'running') {
      expect(run.currentIndex).toBe(1)
    }
  })

  it('completes when advancing past the last step', () => {
    tasks.hydrateFromRows([taskRow('t1', [multiStepSet('s1', [1, 1])])])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    vi.advanceTimersByTime(60_000)
    r.advance('t1')
    vi.advanceTimersByTime(60_000)
    expect(r.runForTask('t1')?.status).toBe('completed')
  })

  it('is a no-op while the run is still in the running state', () => {
    tasks.hydrateFromRows([taskRow('t1', [multiStepSet('s1', [1, 1])])])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    r.advance('t1') // still running
    expect(r.runForTask('t1')?.status).toBe('running')
  })
})

describe('cancel / dismiss', () => {
  it('cancel removes the run from the map', () => {
    tasks.hydrateFromRows([taskRow('t1', [oneStepSet('s1', 5)])])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    r.cancel('t1')
    expect(r.runForTask('t1')).toBeNull()
  })

  it('dismiss removes a completed/awaiting run', () => {
    tasks.hydrateFromRows([taskRow('t1', [oneStepSet('s1', 1)])])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    vi.advanceTimersByTime(60_000)
    r.dismiss('t1')
    expect(r.runForTask('t1')).toBeNull()
  })
})

describe('remainingSecondsFor', () => {
  it('returns the time left on the current step', () => {
    tasks.hydrateFromRows([taskRow('t1', [multiStepSet('s1', [2])])])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    expect(r.remainingSecondsFor('t1')).toBeCloseTo(120, 0)

    vi.advanceTimersByTime(30_000)
    expect(r.remainingSecondsFor('t1')).toBeCloseTo(90, 0)
  })

  it('returns null for non-running runs', () => {
    tasks.hydrateFromRows([taskRow('t1', [oneStepSet('s1', 1)])])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    vi.advanceTimersByTime(60_000) // completed
    expect(r.remainingSecondsFor('t1')).toBeNull()
  })
})

describe('localStorage round-trip', () => {
  it('writes the running run to localStorage on start', () => {
    tasks.hydrateFromRows([taskRow('t1', [oneStepSet('s1', 5)])])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    const raw = localStorage.getItem('daibx_timer_runs')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.v).toBe(2)
    expect(parsed.runs.t1.status).toBe('running')
  })

  it('clears the storage when no runs remain', () => {
    tasks.hydrateFromRows([taskRow('t1', [oneStepSet('s1', 5)])])
    const r = startRunner()
    r.start('g1', 't1', 's1')
    r.cancel('t1')
    expect(localStorage.getItem('daibx_timer_runs')).toBeNull()
  })

  it('hydrates a previously-saved run on construction', () => {
    localStorage.setItem(
      'daibx_timer_runs',
      JSON.stringify({
        v: 2,
        runs: {
          t1: {
            status: 'running',
            taskId: 't1',
            groupId: 'g1',
            timerSetId: 's1',
            currentIndex: 0,
            stepStartedAt: new Date(FIXED_NOW.getTime() - 30_000).toISOString(),
          },
        },
      }),
    )
    tasks.hydrateFromRows([taskRow('t1', [multiStepSet('s1', [2])])])
    const r = startRunner()
    expect(r.runForTask('t1')?.status).toBe('running')
  })
})

describe('stale-purge on hydrate', () => {
  it('drops runs whose task has been deleted', () => {
    localStorage.setItem(
      'daibx_timer_runs',
      JSON.stringify({
        v: 2,
        runs: {
          ghost: {
            status: 'running',
            taskId: 'ghost',
            groupId: 'g1',
            timerSetId: 's-missing',
            currentIndex: 0,
            stepStartedAt: FIXED_NOW.toISOString(),
          },
        },
      }),
    )
    // beforeEach already loaded tasks (loaded=true). No matching task exists,
    // so the purge effect should remove `ghost` on runner construction.
    const r = startRunner()
    expect(r.runForTask('ghost')).toBeNull()
  })

  it('drops runs whose timer set has been removed', () => {
    localStorage.setItem(
      'daibx_timer_runs',
      JSON.stringify({
        v: 2,
        runs: {
          t1: {
            status: 'running',
            taskId: 't1',
            groupId: 'g1',
            timerSetId: 's-gone',
            currentIndex: 0,
            stepStartedAt: FIXED_NOW.toISOString(),
          },
        },
      }),
    )
    tasks.hydrateFromRows([taskRow('t1', [oneStepSet('s-different', 5)])])
    const r = startRunner()
    expect(r.runForTask('t1')).toBeNull()
  })
})

describe('multiple concurrent runs', () => {
  it('runningRuns is sorted by earliest endMs', () => {
    tasks.hydrateFromRows([
      taskRow('tA', [oneStepSet('sA', 5)]),
      taskRow('tB', [oneStepSet('sB', 2)]),
      taskRow('tC', [oneStepSet('sC', 10)]),
    ])
    const r = startRunner()
    r.start('g1', 'tA', 'sA')
    r.start('g1', 'tB', 'sB')
    r.start('g1', 'tC', 'sC')
    const ids = r.runningRuns().map((x) => x.taskId)
    expect(ids).toEqual(['tB', 'tA', 'tC'])
  })
})
