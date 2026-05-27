/**
 * Timers runner. Ported from
 *   client-web-old/src/app/features/timers/data-access/timers.runner.ts
 *
 * Long-lived singleton — one per app, constructed by
 * `WorkspaceContextProvider`. Tracks multiple concurrent timer runs in a
 * `Record<taskId, ActiveRun>`. A single 1-second tick signal drives every
 * running run's "remaining seconds" derivation; each step has its own
 * drift-corrected `setTimeout` to handle elapse.
 *
 * State transitions on step elapse:
 *   - last step → status 'completed'
 *   - non-last step + autoAdvance → status 'running' (next step)
 *   - non-last step + !autoAdvance → status 'awaitingAdvance'
 *
 * Runs persist to localStorage under the same key the Angular app used
 * (`daibx_timer_runs`), so an in-progress timer survives the Angular →
 * SolidJS cutover (per requirements Open Question 5, resolved during design).
 *
 * Stale runs (deleted task, deleted timer set) are purged on hydrate once
 * the tasks store has loaded.
 */

import {
  type Accessor,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  onCleanup,
} from 'solid-js'
import { resolveSound, type SoundHandle } from '~/lib/audio'
import type { SoundsStore } from '~/features/sounds/store'
import type { TasksStore } from '~/features/tasks/store'
import {
  isActiveRun,
  isLegacyTimerRun,
  type ActiveRun,
  type TimerRunsMap,
  type TimerSet,
  type TimerSpec,
} from './types'

const STORAGE_KEY = 'daibx_timer_runs'
const LEGACY_STORAGE_KEY = 'daibx_timer_run'
const STORAGE_VERSION = 2

type RunningRun = Extract<ActiveRun, { status: 'running' }>

export interface RunWithKey {
  taskId: string
  run: ActiveRun
}

export interface StepInfo {
  set: TimerSet
  step: TimerSpec
  index: number
}

export interface FocusedRun {
  taskId: string
  run: ActiveRun
  index: number
  total: number
}

export interface TimersRunner {
  runs: Accessor<TimerRunsMap>
  runningRuns: Accessor<RunWithKey[]>
  attentionRuns: Accessor<RunWithKey[]>
  focusedRun: Accessor<FocusedRun | null>

  runForTask: (taskId: string) => ActiveRun | null
  remainingSecondsFor: (taskId: string) => number | null
  currentStepFor: (taskId: string) => StepInfo | null
  /** Reactive — true while this task's sound handle is active. */
  isRinging: (taskId: string) => boolean

  start: (groupId: string, taskId: string, timerSetId: string) => void
  advance: (taskId: string) => void
  cancel: (taskId: string) => void
  dismiss: (taskId: string) => void
  /** Stop the active ring without changing run state (state stays in
   *  `awaitingAdvance` / `completed`). The Next/Done buttons silence
   *  *and* progress; `silence` is for users who want quiet but aren't
   *  ready to commit to either. */
  silence: (taskId: string) => void
  focusNext: () => void
  focusPrev: () => void

  /** Test-only / app-shutdown cleanup. */
  dispose: () => void
}

export interface TimersRunnerDeps {
  tasks: TasksStore
  sounds: SoundsStore
}

export function createTimersRunner(deps: TimersRunnerDeps): TimersRunner {
  let result!: TimersRunner

  createRoot((dispose) => {
    const [runs, setRuns] = createSignal<TimerRunsMap>(loadFromStorage())
    const [now, setNow] = createSignal(Date.now())
    const [focusedTaskId, setFocusedTaskId] = createSignal<string | null>(null)
    // Reactive mirror of `soundHandles.keys()`. Kept in sync via
    // `swapSoundHandle` and `stopSoundFor` so the banner can show/hide its
    // Silence button as the actual audio comes and goes.
    const [ringingTaskIds, setRingingTaskIds] = createSignal<ReadonlySet<string>>(new Set())

    const fireTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
    const scheduledKeys = new Map<string, string>()
    const soundHandles = new Map<string, SoundHandle>()
    let tickIntervalId: ReturnType<typeof setInterval> | null = null

    const findTimerSet = (run: ActiveRun): TimerSet | null => {
      const found = deps.tasks.findTask(run.taskId)
      return found?.task.timerSets.find((s) => s.id === run.timerSetId) ?? null
    }

    const findStep = (run: ActiveRun): StepInfo | null => {
      const set = findTimerSet(run)
      if (!set) return null
      const idx =
        run.status === 'running'
          ? run.currentIndex
          : 'completedIndex' in run
            ? run.completedIndex
            : -1
      if (idx < 0) return null
      const step = set.timers[idx]
      if (!step) return null
      return { set, step, index: idx }
    }

    const runningRuns = createMemo<RunWithKey[]>(() => {
      const map = runs()
      const out: { entry: RunWithKey; endMs: number }[] = []
      for (const taskId of Object.keys(map)) {
        const run = map[taskId]
        if (!run || run.status !== 'running') continue
        const step = findStep(run)
        if (!step) continue
        const endMs = Date.parse(run.stepStartedAt) + step.step.durationMinutes * 60_000
        out.push({ entry: { taskId, run }, endMs })
      }
      out.sort((a, b) => a.endMs - b.endMs)
      return out.map((o) => o.entry)
    })

    const attentionRuns = createMemo<RunWithKey[]>(() => {
      const map = runs()
      const ringing = ringingTaskIds()
      const out: RunWithKey[] = []
      for (const taskId of Object.keys(map)) {
        const run = map[taskId]
        if (!run) continue
        // Attention = state demands interaction (awaiting/completed) OR
        // sound is currently playing during a still-running step. The
        // second case is what surfaces the Silence button when an
        // auto-advance step's ring is bleeding into the next step.
        if (
          run.status === 'awaitingAdvance' ||
          run.status === 'completed' ||
          (run.status === 'running' && ringing.has(taskId))
        ) {
          out.push({ taskId, run })
        }
      }
      out.sort((a, b) => {
        const ta = 'finishedAt' in a.run ? Date.parse(a.run.finishedAt) : 0
        const tb = 'finishedAt' in b.run ? Date.parse(b.run.finishedAt) : 0
        return ta - tb
      })
      return out
    })

    const focusedRun = createMemo<FocusedRun | null>(() => {
      const list = attentionRuns()
      if (list.length === 0) return null
      const id = focusedTaskId()
      const idx = id === null ? 0 : list.findIndex((r) => r.taskId === id)
      const safeIdx = idx === -1 ? 0 : idx
      const pick = list[safeIdx]
      if (!pick) return null
      return { taskId: pick.taskId, run: pick.run, index: safeIdx, total: list.length }
    })

    const removeRun = (taskId: string): void => {
      setRuns((m) => {
        if (!(taskId in m)) return m
        const next = { ...m }
        delete next[taskId]
        return next
      })
    }

    const stopSoundFor = (taskId: string): void => {
      const handle = soundHandles.get(taskId)
      if (!handle) return
      handle.stop()
      soundHandles.delete(taskId)
      setRingingTaskIds((prev) => {
        if (!prev.has(taskId)) return prev
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }

    const swapSoundHandle = (taskId: string, handle: SoundHandle): void => {
      soundHandles.get(taskId)?.stop()
      soundHandles.set(taskId, handle)
      setRingingTaskIds((prev) => {
        if (prev.has(taskId)) return prev
        const next = new Set(prev)
        next.add(taskId)
        return next
      })
    }

    const playForRun = async (
      taskId: string,
      setSoundId: string | null,
    ): Promise<void> => {
      const resolved = await resolveSound({
        specifiedId: setSoundId,
        defaultId: deps.sounds.state.defaultSoundId,
        fetchBlob: (id) => deps.sounds.getBlob(id),
      })
      // If the run was cancelled/dismissed while we were resolving the
      // buffer, drop the result — `cancel` / `dismiss` already cleared any
      // existing handle.
      if (!runs()[taskId]) return
      swapSoundHandle(taskId, resolved.play({ loop: true }))
    }

    const handleStepEnd = (taskId: string): void => {
      const run = runs()[taskId]
      if (!run || run.status !== 'running') return
      const set = findTimerSet(run)
      const step = set?.timers[run.currentIndex]
      if (!set || !step) {
        removeRun(taskId)
        return
      }

      // Ring on every step end — completed, awaitingAdvance, AND auto-advance
      // transitions. Sound loops; users have the `Silence` button on the
      // running banner (and Next/Cancel/Done for state changes). The
      // cleanup effect below also stops rings when the state leaves the
      // attention set.
      void playForRun(taskId, set.soundId)

      const isLast = run.currentIndex >= set.timers.length - 1
      if (isLast) {
        setRuns((m) => ({
          ...m,
          [taskId]: {
            status: 'completed',
            taskId,
            groupId: run.groupId,
            timerSetId: run.timerSetId,
            finishedAt: new Date().toISOString(),
          },
        }))
        return
      }
      if (set.autoAdvance) {
        setRuns((m) => ({
          ...m,
          [taskId]: {
            status: 'running',
            taskId,
            groupId: run.groupId,
            timerSetId: run.timerSetId,
            currentIndex: run.currentIndex + 1,
            stepStartedAt: new Date().toISOString(),
          },
        }))
        return
      }
      setRuns((m) => ({
        ...m,
        [taskId]: {
          status: 'awaitingAdvance',
          taskId,
          groupId: run.groupId,
          timerSetId: run.timerSetId,
          completedIndex: run.currentIndex,
          finishedAt: new Date().toISOString(),
        },
      }))
    }

    const scheduleFire = (taskId: string, run: RunningRun): void => {
      const step = findStep(run)
      if (!step) return
      const endMs = Date.parse(run.stepStartedAt) + step.step.durationMinutes * 60_000
      const delay = Math.max(0, endMs - Date.now())
      const handle = setTimeout(() => handleStepEnd(taskId), delay)
      fireTimeouts.set(taskId, handle)
    }

    // 1. Persist to localStorage after every change.
    createEffect(() => saveToStorage(runs()))

    // 2. Purge stale runs (deleted task / deleted timer set) once tasks have loaded.
    createEffect(() => {
      if (!deps.tasks.state.loaded) return
      const map = runs()
      const stale: string[] = []
      for (const taskId of Object.keys(map)) {
        const r = map[taskId]
        if (!r || !findTimerSet(r)) stale.push(taskId)
      }
      if (stale.length === 0) return
      setRuns((m) => {
        const next = { ...m }
        for (const id of stale) delete next[id]
        return next
      })
    })

    // 3. Schedule / clear fire timeouts based on running runs' stepStartedAt.
    createEffect(() => {
      const map = runs()
      const desired = new Map<string, RunningRun>()
      for (const taskId of Object.keys(map)) {
        const run = map[taskId]
        if (run?.status === 'running') desired.set(taskId, run)
      }
      // Clear schedules that no longer match the live run.
      for (const [taskId, fp] of Array.from(scheduledKeys.entries())) {
        const run = desired.get(taskId)
        if (!run || fp !== run.stepStartedAt) {
          const handle = fireTimeouts.get(taskId)
          if (handle !== undefined) clearTimeout(handle)
          fireTimeouts.delete(taskId)
          scheduledKeys.delete(taskId)
        }
      }
      // Schedule any newly-running steps.
      for (const [taskId, run] of desired) {
        if (scheduledKeys.get(taskId) === run.stepStartedAt) continue
        scheduleFire(taskId, run)
        scheduledKeys.set(taskId, run.stepStartedAt)
      }
    })

    // 4. Tick interval — running only when there's at least one running run.
    createEffect(() => {
      const hasRunning = runningRuns().length > 0
      if (hasRunning && tickIntervalId === null) {
        setNow(Date.now())
        tickIntervalId = setInterval(() => setNow(Date.now()), 1000)
      } else if (!hasRunning && tickIntervalId !== null) {
        clearInterval(tickIntervalId)
        tickIntervalId = null
      }
    })

    // 5. Auto-focus the first attention run when current focus is invalid.
    createEffect(() => {
      const list = attentionRuns()
      const id = focusedTaskId()
      if (list.length === 0) {
        if (id !== null) setFocusedTaskId(null)
        return
      }
      if (id === null || !list.some((r) => r.taskId === id)) {
        setFocusedTaskId(list[0]?.taskId ?? null)
      }
    })

    // 6. Stop sounds for runs that are no longer in the attention set.
    createEffect(() => {
      const map = runs()
      const wanted = new Set<string>()
      for (const taskId of Object.keys(map)) {
        const run = map[taskId]
        if (run?.status === 'awaitingAdvance' || run?.status === 'completed') {
          wanted.add(taskId)
        }
      }
      for (const taskId of Array.from(soundHandles.keys())) {
        if (!wanted.has(taskId)) stopSoundFor(taskId)
      }
    })

    onCleanup(() => {
      for (const id of fireTimeouts.values()) clearTimeout(id)
      fireTimeouts.clear()
      scheduledKeys.clear()
      if (tickIntervalId !== null) {
        clearInterval(tickIntervalId)
        tickIntervalId = null
      }
      for (const h of soundHandles.values()) h.stop()
      soundHandles.clear()
    })

    result = {
      runs,
      runningRuns,
      attentionRuns,
      focusedRun,

      runForTask: (taskId) => runs()[taskId] ?? null,

      remainingSecondsFor: (taskId) => {
        const run = runs()[taskId]
        if (!run || run.status !== 'running') return null
        const step = findStep(run)
        if (!step) return null
        const endMs = Date.parse(run.stepStartedAt) + step.step.durationMinutes * 60_000
        return (endMs - now()) / 1000
      },

      currentStepFor: (taskId) => {
        const run = runs()[taskId]
        if (!run) return null
        return findStep(run)
      },

      start: (groupId, taskId, timerSetId) => {
        const found = deps.tasks.findTask(taskId)
        const set = found?.task.timerSets.find((s) => s.id === timerSetId)
        if (!set || set.timers.length === 0) return
        stopSoundFor(taskId)
        setRuns((m) => ({
          ...m,
          [taskId]: {
            status: 'running',
            taskId,
            groupId,
            timerSetId,
            currentIndex: 0,
            stepStartedAt: new Date().toISOString(),
          },
        }))
      },

      advance: (taskId) => {
        const run = runs()[taskId]
        if (!run || run.status !== 'awaitingAdvance') return
        const set = findTimerSet(run)
        if (!set) {
          removeRun(taskId)
          return
        }
        stopSoundFor(taskId)
        const nextIndex = run.completedIndex + 1
        if (nextIndex >= set.timers.length) {
          setRuns((m) => ({
            ...m,
            [taskId]: {
              status: 'completed',
              taskId,
              groupId: run.groupId,
              timerSetId: run.timerSetId,
              finishedAt: new Date().toISOString(),
            },
          }))
          return
        }
        setRuns((m) => ({
          ...m,
          [taskId]: {
            status: 'running',
            taskId,
            groupId: run.groupId,
            timerSetId: run.timerSetId,
            currentIndex: nextIndex,
            stepStartedAt: new Date().toISOString(),
          },
        }))
      },

      cancel: (taskId) => {
        if (!runs()[taskId]) return
        stopSoundFor(taskId)
        removeRun(taskId)
      },

      dismiss: (taskId) => {
        if (!runs()[taskId]) return
        stopSoundFor(taskId)
        removeRun(taskId)
      },

      silence: (taskId) => stopSoundFor(taskId),

      isRinging: (taskId) => ringingTaskIds().has(taskId),

      focusNext: () => {
        const list = attentionRuns()
        if (list.length === 0) return
        const id = focusedTaskId()
        const idx = id === null ? 0 : list.findIndex((r) => r.taskId === id)
        const safe = idx === -1 ? 0 : idx
        const next = list[(safe + 1) % list.length]
        if (next) setFocusedTaskId(next.taskId)
      },

      focusPrev: () => {
        const list = attentionRuns()
        if (list.length === 0) return
        const id = focusedTaskId()
        const idx = id === null ? 0 : list.findIndex((r) => r.taskId === id)
        const safe = idx === -1 ? 0 : idx
        const prev = list[(safe - 1 + list.length) % list.length]
        if (prev) setFocusedTaskId(prev.taskId)
      },

      dispose: () => {
        for (const id of fireTimeouts.values()) clearTimeout(id)
        fireTimeouts.clear()
        scheduledKeys.clear()
        if (tickIntervalId !== null) {
          clearInterval(tickIntervalId)
          tickIntervalId = null
        }
        for (const h of soundHandles.values()) h.stop()
        soundHandles.clear()
        dispose()
      },
    }
  })

  return result
}

// ────────────────────────────────────────────────────────────────────────────
// localStorage helpers

const loadFromStorage = (): TimerRunsMap => {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw)
      if (isEnvelope(parsed) && parsed.v === STORAGE_VERSION) {
        const map: TimerRunsMap = {}
        for (const taskId of Object.keys(parsed.runs)) {
          const entry = parsed.runs[taskId]
          if (isActiveRun(entry)) map[taskId] = entry
        }
        return map
      }
      localStorage.removeItem(STORAGE_KEY)
    }
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacyRaw !== null) {
      try {
        const legacy: unknown = JSON.parse(legacyRaw)
        localStorage.removeItem(LEGACY_STORAGE_KEY)
        if (isLegacyTimerRun(legacy) && (legacy as { status?: string }).status !== 'idle') {
          const run = legacy as ActiveRun
          return { [run.taskId]: run }
        }
      } catch {
        localStorage.removeItem(LEGACY_STORAGE_KEY)
      }
    }
    return {}
  } catch {
    return {}
  }
}

const saveToStorage = (runsMap: TimerRunsMap): void => {
  if (typeof localStorage === 'undefined') return
  try {
    if (Object.keys(runsMap).length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: STORAGE_VERSION, runs: runsMap }),
    )
  } catch {
    /* quota or unavailable */
  }
}

const isEnvelope = (
  value: unknown,
): value is { v: number; runs: Record<string, unknown> } => {
  if (!value || typeof value !== 'object') return false
  const v = value as { v?: unknown; runs?: unknown }
  return typeof v.v === 'number' && !!v.runs && typeof v.runs === 'object'
}
