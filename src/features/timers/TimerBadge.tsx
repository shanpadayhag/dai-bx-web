import { Show } from 'solid-js'
import { Timer } from 'lucide-solid'
import { cn } from '~/lib/classnames'
import { formatSetSummary } from './lib/timerFormat'
import type { TimerSet } from './types'

/**
 * Small timer-icon + step-summary chip rendered on a task row when the
 * task has a timer set. Highlighted (Instrument Blue) while running.
 *
 * The visual difference between active and idle is color + weight; for
 * accessibility we add a screen-reader-only "Running" indicator so the
 * state is not communicated by color alone (per PRODUCT.md A11y rules).
 */

interface Props {
  set: TimerSet
  active: boolean
}

export default function TimerBadge(props: Props) {
  return (
    <span
      class={cn(
        'inline-flex items-center gap-1 rounded-md border-2 border-border px-1.5 h-6 tracking-tight',
        props.active
          ? 'bg-primary text-primary-foreground font-bold'
          : 'bg-secondary-background text-foreground font-semibold',
      )}
    >
      <Timer size={12} aria-hidden="true" />
      <span class="readout text-xs">{formatSetSummary(props.set)}</span>
      <Show when={props.active}>
        <span class="sr-only"> · Running</span>
      </Show>
    </span>
  )
}
