/**
 * Alarms scheduler. Ported from
 *   client-web-old/src/app/features/alarms/data-access/alarms.scheduler.ts
 *
 * Long-lived singleton (one per app). Uses a `createMemo` to track the next
 * enabled, future alarm across all tasks and a `setTimeout` to fire it. On
 * fire, plays the resolved sound, exposes a `firing` signal for the UI modal,
 * and reschedules (`repeat: 'daily'`) or disables (`repeat: 'none'`) the alarm.
 *
 * The scheduler is constructed by `WorkspaceContextProvider` with the tasks +
 * sounds stores. Tests can instantiate one directly and call `dispose()` to
 * tear it down.
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
import type { Task } from '~/features/tasks/types'

const DAY_MS = 86_400_000

export interface FiringAlarm {
  task: Task
  groupId: string
}

export interface NextAlarm {
  task: Task
  groupId: string
  /** UNIX timestamp (ms) the alarm is due to fire. */
  at: number
}

export interface AlarmsScheduler {
  /** Current firing alarm, or null. The UI modal subscribes to this. */
  firing: Accessor<FiringAlarm | null>
  /** Next enabled, future alarm across all tasks, or null. The status strip reads this. */
  nextAlarm: Accessor<NextAlarm | null>
  /** Stop the currently-playing sound (if any) and clear the firing state. */
  dismiss: () => void
  /** Test-only / app-shutdown cleanup. Stops timers, sound, and disposes the root. */
  dispose: () => void
}

export interface SchedulerDeps {
  tasks: TasksStore
  sounds: SoundsStore
}

interface NextDue {
  task: Task
  groupId: string
  at: number
}

export function createAlarmsScheduler(deps: SchedulerDeps): AlarmsScheduler {
  let result!: AlarmsScheduler

  createRoot((dispose) => {
    const [firing, setFiring] = createSignal<FiringAlarm | null>(null)
    let timerId: ReturnType<typeof setTimeout> | null = null
    let activeHandle: SoundHandle | null = null

    const clearTimer = (): void => {
      if (timerId !== null) {
        clearTimeout(timerId)
        timerId = null
      }
    }

    const stopActive = (): void => {
      activeHandle?.stop()
      activeHandle = null
    }

    const nextDue = createMemo<NextDue | null>(() => {
      let best: NextDue | null = null
      for (const entry of deps.tasks.tasksWithAlarm()) {
        const alarm = entry.task.alarm
        if (!alarm || !alarm.enabled) continue
        const at = Date.parse(alarm.firesAt)
        if (Number.isNaN(at)) continue
        if (!best || at < best.at) {
          best = { task: entry.task, groupId: entry.groupId, at }
        }
      }
      return best
    })

    const fire = (entry: NextDue): void => {
      const found = deps.tasks.findTask(entry.task.id)
      if (!found) return
      const alarm = found.task.alarm
      if (!alarm) return

      // 1) Surface the firing state synchronously so the UI can react.
      setFiring({ task: found.task, groupId: entry.groupId })

      // 2) Resolve and play sound in the background. Don't block the fire path.
      void (async () => {
        const resolved = await resolveSound({
          specifiedId: alarm.soundId,
          defaultId: deps.sounds.state.defaultSoundId,
          fetchBlob: (id) => deps.sounds.getBlob(id),
        })
        // If the user dismissed before we resolved, skip.
        if (firing() === null) return
        activeHandle = resolved.play({ loop: true })
      })()

      // 3) Mutate the alarm: daily reschedule or one-shot disable.
      if (alarm.repeat === 'daily') {
        let nextMs = Date.parse(alarm.firesAt)
        if (Number.isNaN(nextMs)) return
        do {
          nextMs += DAY_MS
        } while (nextMs <= Date.now())
        void deps.tasks.setAlarm(entry.groupId, entry.task.id, {
          ...alarm,
          firesAt: new Date(nextMs).toISOString(),
        })
        return
      }
      void deps.tasks.setAlarm(entry.groupId, entry.task.id, {
        ...alarm,
        enabled: false,
      })
    }

    createEffect(() => {
      const next = nextDue()
      clearTimer()
      if (!next) return
      const delay = Math.max(0, next.at - Date.now())
      timerId = setTimeout(() => fire(next), delay)
    })

    onCleanup(() => {
      clearTimer()
      stopActive()
    })

    result = {
      firing,
      nextAlarm: nextDue,
      dismiss: (): void => {
        stopActive()
        setFiring(null)
      },
      dispose: (): void => {
        clearTimer()
        stopActive()
        dispose()
      },
    }
  })

  return result
}
