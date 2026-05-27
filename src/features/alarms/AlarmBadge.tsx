import { Bell, BellOff } from 'lucide-solid'
import { cn } from '~/lib/classnames'
import { formatAlarmTime } from './lib/alarmFormat'
import type { AlarmSpec } from './types'

/**
 * Small bell + time chip rendered on a task row when it has an alarm.
 * Muted (bell-off) when disabled.
 */

interface Props {
  alarm: AlarmSpec
}

export default function AlarmBadge(props: Props) {
  const isDisabled = (): boolean => props.alarm.enabled === false
  const label = (): string => formatAlarmTime(props.alarm.firesAt)

  return (
    <span
      class={cn(
        'inline-flex items-center gap-1 rounded-md border-2 border-border px-1.5 h-6 tracking-tight',
        isDisabled()
          ? 'bg-secondary-background/50 text-subtle-foreground font-semibold opacity-60'
          : 'bg-secondary-background text-foreground font-semibold',
      )}
    >
      {isDisabled() ? <BellOff size={12} /> : <Bell size={12} />}
      <span class="readout text-xs">{label()}</span>
    </span>
  )
}
