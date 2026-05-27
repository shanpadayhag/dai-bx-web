import { ChevronDown, ChevronUp } from 'lucide-solid'
import { cn } from '~/lib/classnames'

/**
 * Hour + minute + AM/PM picker. Ported from
 *   client-web-old/.../alarms/ui/time-spinner/time-spinner.component.*
 *
 * Stateless: parent owns the value and listens for change.
 */

export interface TimeOfDay {
  hour: number // 0..23 (24-hour internally)
  minute: number // 0..59
}

const wrap = (n: number, mod: number): number => ((n % mod) + mod) % mod
const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n))

const pad = (n: number): string => String(n).padStart(2, '0')

interface Props {
  value: TimeOfDay
  onChange: (next: TimeOfDay) => void
}

export default function TimeSpinner(props: Props) {
  const hourDisplay = (): string => {
    const h = props.value.hour % 12
    return pad(h === 0 ? 12 : h)
  }
  const minuteDisplay = (): string => pad(props.value.minute)
  const isPm = (): boolean => props.value.hour >= 12

  const emit = (hour: number, minute: number): void =>
    props.onChange({ hour, minute })

  const adjustHour = (delta: number): void =>
    emit(wrap(props.value.hour + delta, 24), props.value.minute)

  const adjustMinute = (delta: number): void => {
    const total = props.value.hour * 60 + props.value.minute + delta
    const w = wrap(total, 24 * 60)
    emit(Math.floor(w / 60), w % 60)
  }

  const toggleMeridiem = (): void =>
    emit(wrap(props.value.hour + 12, 24), props.value.minute)

  const setMeridiem = (target: 'am' | 'pm'): void => {
    if (target === 'pm' && isPm()) return
    if (target === 'am' && !isPm()) return
    toggleMeridiem()
  }

  const onHourInput = (event: Event): void => {
    const input = event.target as HTMLInputElement
    const digits = input.value.replace(/\D/g, '').slice(-2)
    if (!digits) return
    const n = parseInt(digits, 10)
    if (digits.length === 1 && n === 0) {
      input.value = ''
      return
    }
    const twelve = clamp(n, 1, 12)
    const hour = twelve === 12 ? (isPm() ? 12 : 0) : isPm() ? twelve + 12 : twelve
    emit(hour, props.value.minute)
    const isComplete = digits.length === 2 || (digits.length === 1 && n >= 2)
    if (isComplete) input.value = pad(twelve)
  }

  const onMinuteInput = (event: Event): void => {
    const input = event.target as HTMLInputElement
    const digits = input.value.replace(/\D/g, '').slice(-2)
    if (!digits) return
    emit(props.value.hour, clamp(parseInt(digits, 10), 0, 59))
  }

  // Normalize displayed value to zero-padded on blur. While the input is
  // focused we leave it alone — the `attr:value` binding sets the *attribute*
  // (initial value), so the user's in-flight property value is preserved.
  // This is what fixes the "typed 1 → input snaps to 01 → maxLength=2 blocks
  // the second digit" bug.
  const onSegmentBlur = (event: FocusEvent, kind: 'hour' | 'minute'): void => {
    const input = event.currentTarget as HTMLInputElement
    input.value = kind === 'hour' ? hourDisplay() : minuteDisplay()
  }

  const segmentBase =
    'flex-1 flex items-center justify-center text-xs font-bold tracking-[0.08em] cursor-pointer select-none transition-colors'

  const amClass = (): string =>
    isPm()
      ? `${segmentBase} bg-secondary-background text-subtle-foreground border-b-2 border-border hover:text-foreground`
      : `${segmentBase} bg-foreground text-secondary-background border-b-2 border-border`

  const pmClass = (): string =>
    isPm()
      ? `${segmentBase} bg-foreground text-secondary-background`
      : `${segmentBase} bg-secondary-background text-subtle-foreground hover:text-foreground`

  return (
    <div class="flex items-stretch justify-center gap-2 select-none">
      {/* Hour */}
      <div class="flex flex-col items-center gap-1">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => adjustHour(1)}
          class="inline-flex h-8 w-20 items-center justify-center rounded-md border-2 border-transparent text-foreground hover:border-border hover:bg-secondary-background transition-colors cursor-pointer"
          aria-label="Increase hour"
        >
          <ChevronUp size={16} />
        </button>
        <input
          type="text"
          inputmode="numeric"
          maxLength={2}
          attr:value={hourDisplay()}
          onInput={onHourInput}
          onBlur={(e) => onSegmentBlur(e, 'hour')}
          onFocus={(e) => (e.currentTarget as HTMLInputElement).select()}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              adjustHour(1)
              e.preventDefault()
            }
            if (e.key === 'ArrowDown') {
              adjustHour(-1)
              e.preventDefault()
            }
            if (e.key === ' ') {
              toggleMeridiem()
              e.preventDefault()
            }
          }}
          class="readout h-20 w-20 rounded-md border-2 border-border bg-secondary-background text-center text-5xl font-bold tracking-tight shadow-brutal-sm transition-shadow focus-visible:shadow-brutal"
          aria-label="Hour"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => adjustHour(-1)}
          class="inline-flex h-8 w-20 items-center justify-center rounded-md border-2 border-transparent text-foreground hover:border-border hover:bg-secondary-background transition-colors cursor-pointer"
          aria-label="Decrease hour"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Colon */}
      <div class="flex flex-col items-center gap-1" aria-hidden="true">
        <div class="h-8" />
        <div class="readout flex h-20 items-center justify-center text-5xl font-black text-foreground">
          :
        </div>
        <div class="h-8" />
      </div>

      {/* Minute */}
      <div class="flex flex-col items-center gap-1">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => adjustMinute(1)}
          class="inline-flex h-8 w-20 items-center justify-center rounded-md border-2 border-transparent text-foreground hover:border-border hover:bg-secondary-background transition-colors cursor-pointer"
          aria-label="Increase minute"
        >
          <ChevronUp size={16} />
        </button>
        <input
          type="text"
          inputmode="numeric"
          maxLength={2}
          attr:value={minuteDisplay()}
          onInput={onMinuteInput}
          onBlur={(e) => onSegmentBlur(e, 'minute')}
          onFocus={(e) => (e.currentTarget as HTMLInputElement).select()}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              adjustMinute(1)
              e.preventDefault()
            }
            if (e.key === 'ArrowDown') {
              adjustMinute(-1)
              e.preventDefault()
            }
            if (e.key === ' ') {
              toggleMeridiem()
              e.preventDefault()
            }
          }}
          class="readout h-20 w-20 rounded-md border-2 border-border bg-secondary-background text-center text-5xl font-bold tracking-tight shadow-brutal-sm transition-shadow focus-visible:shadow-brutal"
          aria-label="Minute"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => adjustMinute(-1)}
          class="inline-flex h-8 w-20 items-center justify-center rounded-md border-2 border-transparent text-foreground hover:border-border hover:bg-secondary-background transition-colors cursor-pointer"
          aria-label="Decrease minute"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* AM/PM */}
      <div class="flex flex-col items-center gap-1">
        <div class="h-8" aria-hidden="true" />
        <div
          class="flex h-20 w-14 flex-col overflow-hidden rounded-md border-2 border-border shadow-brutal-sm"
          role="group"
          aria-label="AM or PM"
        >
          <button
            type="button"
            class={cn(amClass())}
            onClick={() => setMeridiem('am')}
            aria-pressed={!isPm()}
          >
            AM
          </button>
          <button
            type="button"
            class={cn(pmClass())}
            onClick={() => setMeridiem('pm')}
            aria-pressed={isPm()}
          >
            PM
          </button>
        </div>
        <div class="h-8" aria-hidden="true" />
      </div>
    </div>
  )
}
