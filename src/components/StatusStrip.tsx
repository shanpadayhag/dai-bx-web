import { A } from '@solidjs/router'
import { Show, createSignal, onCleanup, onMount } from 'solid-js'
import { Bell, Play, Settings } from 'lucide-solid'
import { useWorkspace } from '~/state/workspaceContext'
import { formatAlarmTime } from '~/features/alarms/lib/alarmFormat'
import { formatRemaining } from '~/features/timers/lib/timerFormat'

/**
 * Fixed app header. Clock + next-alarm chip (T14) + active-timer chip (T16) +
 * navigation. Most segments hide on small screens.
 */

const pad = (n: number): string => String(n).padStart(2, '0')

export default function StatusStrip() {
  const ws = useWorkspace()
  const [now, setNow] = createSignal(new Date())

  onMount(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    onCleanup(() => clearInterval(id))
  })

  const clockTime = (): string => {
    const d = now()
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  const nextAlarmTime = (): string => {
    const next = ws.alarmsScheduler.nextAlarm()
    if (!next || !next.task.alarm) return ''
    return formatAlarmTime(next.task.alarm.firesAt).replace(/^(Today|Tomorrow) /, '')
  }

  const nextAlarmTaskName = (): string =>
    ws.alarmsScheduler.nextAlarm()?.task.name ?? ''

  // Active-timer chip: show the earliest-ending running run.
  const chipRun = () => ws.timersRunner.runningRuns()[0] ?? null
  const hasActiveTimer = (): boolean => chipRun() !== null
  const extraRunning = (): number =>
    Math.max(0, ws.timersRunner.runningRuns().length - 1)

  const timerRemaining = (): string => {
    const chip = chipRun()
    if (!chip) return '00:00'
    const s = ws.timersRunner.remainingSecondsFor(chip.taskId)
    return s === null ? '00:00' : formatRemaining(s)
  }

  const timerStepBadge = (): string => {
    const chip = chipRun()
    if (!chip) return ''
    const step = ws.timersRunner.currentStepFor(chip.taskId)
    if (!step) return ''
    return `${step.index + 1}/${step.set.timers.length}`
  }

  return (
    <header
      class="fixed inset-x-0 top-0 z-40 h-12 bg-foreground text-secondary-background border-b-2 border-border"
      role="banner"
    >
      <div class="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-5">
        <A
          href="/"
          class="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-75"
          aria-label="DaiBX home"
        >
          <img
            src="/icon.svg"
            alt=""
            class="h-6 w-6 rounded-sm border border-secondary-background/30"
            aria-hidden="true"
          />
          <span class="text-base font-black tracking-tighter">DaiBX</span>
        </A>

        <span class="hidden h-6 w-px bg-secondary-background/20 sm:block" aria-hidden="true"></span>

        <span
          class="readout text-sm font-bold tabular-nums text-secondary-background"
          aria-label={`Current time ${clockTime()}`}
        >
          {clockTime()}
        </span>

        <Show when={ws.alarmsScheduler.nextAlarm()}>
          <span
            class="hidden h-6 w-px bg-secondary-background/20 md:block"
            aria-hidden="true"
          />
          <div class="hidden min-w-0 items-center gap-2 md:flex">
            <Bell size={14} class="shrink-0 text-secondary-background/60" aria-hidden="true" />
            <span class="shrink-0 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-secondary-background/60">
              Next
            </span>
            <span class="readout shrink-0 text-sm font-bold tabular-nums">
              {nextAlarmTime()}
            </span>
            <span class="truncate text-xs font-semibold text-secondary-background/80">
              {nextAlarmTaskName()}
            </span>
          </div>
        </Show>

        <div class="flex-1"></div>

        <Show when={hasActiveTimer()}>
          <div
            class="inline-flex items-center gap-2 rounded-md border-2 border-secondary-background/20 bg-primary px-2.5 py-0.5 text-primary-foreground"
            role="status"
            aria-live="polite"
          >
            <Play size={14} class="shrink-0" aria-hidden="true" />
            <span class="readout text-sm font-bold tabular-nums">{timerRemaining()}</span>
            <Show when={timerStepBadge()}>
              <span class="readout text-[0.625rem] font-bold uppercase tracking-[0.12em] opacity-80">
                {timerStepBadge()}
              </span>
            </Show>
            <Show when={extraRunning() > 0}>
              <span
                class="readout text-[0.625rem] font-bold uppercase tracking-[0.12em] opacity-80"
                aria-label={`${extraRunning()} more timers running`}
              >
                +{extraRunning()}
              </span>
            </Show>
          </div>
        </Show>

        <A
          href="/settings"
          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-secondary-background transition-colors hover:bg-secondary-background/10"
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={16} />
        </A>
      </div>
    </header>
  )
}
