import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { formatSetSummary } from '@features/timers/data-access/timer-format';
import type { TimerSet } from '@features/timers/data-access/timers.types';

@Component({
  selector: 'app-timer-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <span
      class="inline-flex items-center gap-1 rounded-md border-2 border-border bg-secondary-background px-1.5 h-6 text-xs font-bold font-mono tabular-nums tracking-tight text-foreground"
    >
      <lucide-icon name="timer" class="h-3 w-3" />
      {{ label() }}
    </span>
  `,
})
export class TimerBadgeComponent {
  readonly set = input.required<TimerSet>();

  protected readonly label = computed(() => formatSetSummary(this.set()));
}
