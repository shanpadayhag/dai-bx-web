import { Show, createEffect, createSignal } from 'solid-js'
import { A } from '@solidjs/router'
import { BellOff } from 'lucide-solid'
import Button from '~/components/Button'
import Dropdown, { type DropdownOption } from '~/components/Dropdown'
import { cn } from '~/lib/classnames'
import { useWorkspace } from '~/state/workspaceContext'
import { primeAudio } from '~/lib/audio'
import {
  formatAlarmTime,
  isTomorrow,
  nextOccurrenceIso,
  parseHourMinute,
} from './lib/alarmFormat'
import type { AlarmRepeat, AlarmSpec } from './types'
import TimeSpinner, { type TimeOfDay } from './TimeSpinner'

/**
 * Alarm picker dialog. Time spinner, "Fires HH:MM Today|Tomorrow" preview,
 * enable toggle (when an alarm exists), repeat radio, sound dropdown, clear,
 * and Done. Each user-visible change emits a new `AlarmSpec` to the parent.
 */

interface Props {
  show: boolean
  alarm: AlarmSpec | null
  onAlarmChange: (next: AlarmSpec | null) => void
  onClose: () => void
}

const defaultDraft = (now: Date = new Date()): TimeOfDay => {
  const next = new Date(now.getTime() + 30 * 60_000)
  return { hour: next.getHours(), minute: 0 }
}

export default function AlarmPicker(props: Props) {
  const ws = useWorkspace()
  let dialogRef: HTMLDialogElement | undefined
  const [draft, setDraft] = createSignal<TimeOfDay>(defaultDraft())

  createEffect(() => {
    if (!dialogRef) return
    if (props.show && !dialogRef.open) dialogRef.showModal()
    else if (!props.show && dialogRef.open) dialogRef.close()
  })

  const currentTime = (): TimeOfDay =>
    parseHourMinute(props.alarm?.firesAt ?? null) ?? draft()

  const currentSoundId = (): string => props.alarm?.soundId ?? ''
  const currentEnabled = (): boolean => props.alarm?.enabled ?? true
  const currentRepeat = (): AlarmRepeat => props.alarm?.repeat ?? 'none'

  const defaultLabel = (): string => {
    const id = ws.sounds.state.defaultSoundId
    if (!id) return 'Default · built-in beep'
    const sound = ws.sounds.state.sounds.find((s) => s.id === id)
    return sound ? `Default · ${sound.name}` : 'Default'
  }

  const soundOptions = (): DropdownOption[] => [
    { value: '', label: defaultLabel() },
    ...ws.sounds.state.sounds.map((s) => ({ value: s.id, label: s.name })),
  ]

  const previewTime = (): string => {
    const t = currentTime()
    const iso = nextOccurrenceIso(t.hour, t.minute)
    return formatAlarmTime(iso).replace(/^(Today|Tomorrow) /, '')
  }

  const previewDay = (): string => {
    const t = currentTime()
    const iso = nextOccurrenceIso(t.hour, t.minute)
    return isTomorrow(iso) ? 'Tomorrow' : 'Today'
  }

  const onTimeChange = (value: TimeOfDay): void => {
    void primeAudio()
    setDraft(value)
    const current = props.alarm
    props.onAlarmChange({
      firesAt: nextOccurrenceIso(value.hour, value.minute),
      soundId: current?.soundId ?? null,
      enabled: current?.enabled ?? true,
      repeat: current?.repeat ?? 'none',
    })
  }

  const onSoundChange = (value: string): void => {
    const soundId = value || null
    const current = props.alarm
    const t = currentTime()
    const firesAt = current?.firesAt ?? nextOccurrenceIso(t.hour, t.minute)
    props.onAlarmChange({
      firesAt,
      soundId,
      enabled: current?.enabled ?? true,
      repeat: current?.repeat ?? 'none',
    })
  }

  const onEnabledChange = (value: boolean): void => {
    const current = props.alarm
    if (!current) return
    if (!value) {
      props.onAlarmChange({ ...current, enabled: false })
      return
    }
    const parsedAt = Date.parse(current.firesAt)
    let firesAt = current.firesAt
    if (!Number.isNaN(parsedAt) && parsedAt <= Date.now()) {
      const t = parseHourMinute(current.firesAt)
      if (t) firesAt = nextOccurrenceIso(t.hour, t.minute)
    }
    props.onAlarmChange({ ...current, enabled: true, firesAt })
  }

  const onRepeatChange = (value: AlarmRepeat): void => {
    const current = props.alarm
    const t = currentTime()
    const firesAt = current?.firesAt ?? nextOccurrenceIso(t.hour, t.minute)
    props.onAlarmChange({
      firesAt,
      soundId: current?.soundId ?? null,
      enabled: current?.enabled ?? true,
      repeat: value,
    })
  }

  const onClear = (): void => {
    props.onAlarmChange(null)
    props.onClose()
  }

  const handleBackdropClick = (event: MouseEvent): void => {
    if (event.target === dialogRef) props.onClose()
  }

  const repeatBtn = (active: boolean): string =>
    cn(
      'inline-flex items-center justify-center h-9 px-3 rounded-md border-2 border-border text-xs font-bold tracking-tight transition-colors cursor-pointer',
      active
        ? 'bg-foreground text-secondary-background'
        : 'bg-secondary-background text-foreground hover:bg-foreground/5',
    )

  return (
    <dialog
      ref={dialogRef}
      onClose={() => props.onClose()}
      onClick={handleBackdropClick}
      aria-label="Set alarm"
      // m-auto: native <dialog> centers via `margin: auto` once `inset: 0`
      // is set by the UA on showModal(). Tailwind v4's preflight resets
      // `margin: 0` on every element, which breaks that default. Restoring it.
      class="m-auto rounded-md border-2 border-border bg-background shadow-brutal p-0 backdrop:bg-foreground/40 max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]"
    >
      <div class="flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-4 p-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold tracking-[0.1em] uppercase text-foreground">
            Set alarm
          </span>
          <Show when={props.alarm !== null}>
            <Button
              variant="ghost"
              size="icon-sm"
              btnClass="h-7 w-7 text-destructive"
              onClick={onClear}
              title="Clear alarm"
              aria-label="Clear alarm"
            >
              <BellOff size={16} />
            </Button>
          </Show>
        </div>

        <TimeSpinner value={currentTime()} onChange={onTimeChange} />

        <div class="flex items-center gap-3 rounded-md border-2 border-border bg-secondary-background px-3 py-2 shadow-brutal-sm">
          <span class="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-subtle-foreground">
            Fires
          </span>
          <span class="readout text-sm font-bold flex-1">{previewTime()}</span>
          <span class="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-subtle-foreground">
            {previewDay()}
          </span>
        </div>

        <Show when={props.alarm !== null}>
          <label class="flex items-center gap-3 rounded-md border-2 border-border bg-secondary-background px-3 py-2 shadow-brutal-sm cursor-pointer select-none">
            <input
              type="checkbox"
              class="h-4 w-4 accent-foreground"
              checked={currentEnabled()}
              onChange={(e) => onEnabledChange(e.currentTarget.checked)}
            />
            <span class="flex-1 text-sm font-bold tracking-tight">Enabled</span>
            <span class="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-subtle-foreground">
              {currentEnabled() ? 'On' : 'Off'}
            </span>
          </label>
        </Show>

        <div class="space-y-1.5">
          <span class="block text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-subtle-foreground">
            Repeat
          </span>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class={repeatBtn(currentRepeat() === 'none')}
              onClick={() => onRepeatChange('none')}
            >
              One-shot
            </button>
            <button
              type="button"
              class={repeatBtn(currentRepeat() === 'daily')}
              onClick={() => onRepeatChange('daily')}
            >
              Daily
            </button>
          </div>
        </div>

        <div class="space-y-1.5">
          <span class="block text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-subtle-foreground">
            Sound
          </span>
          <Dropdown
            options={soundOptions()}
            value={currentSoundId()}
            onValueChange={onSoundChange}
          />
        </div>

        <A
          href="/settings"
          onClick={() => props.onClose()}
          class="block text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Manage sounds →
        </A>

        <div class="flex justify-end">
          <Button size="sm" btnClass="h-9 px-5" onClick={() => props.onClose()}>
            Done
          </Button>
        </div>
      </div>
    </dialog>
  )
}
