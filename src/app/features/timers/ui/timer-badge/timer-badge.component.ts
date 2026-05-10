import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { cn } from '@shared/utils/cn';
import { formatSetSummary } from '@features/timers/data-access/timer-format';
import type { TimerSet } from '@features/timers/data-access/timers.types';

@Component({
  selector: 'app-timer-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <span [class]="badgeClass()">
      <lucide-icon name="timer" class="h-3 w-3" />
      <span class="readout text-xs">{{ label() }}</span>
    </span>
  `,
})
export class TimerBadgeComponent {
  readonly set = input.required<TimerSet>();
  readonly active = input<boolean>(false);

  protected readonly label = computed(() => formatSetSummary(this.set()));

  protected readonly badgeClass = computed(() =>
    cn(
      'inline-flex items-center gap-1 rounded-md border-2 border-border px-1.5 h-6 tracking-tight',
      this.active()
        ? 'bg-primary text-primary-foreground font-bold'
        : 'bg-secondary-background text-foreground font-semibold',
    ),
  );
}
