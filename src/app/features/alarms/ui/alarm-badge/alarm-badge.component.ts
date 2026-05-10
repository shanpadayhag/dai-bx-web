import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { formatAlarmTime } from '@features/alarms/data-access/alarm-format';
import type { AlarmSpec } from '@features/alarms/data-access/alarms.types';

@Component({
  selector: 'app-alarm-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <span
      class="inline-flex items-center gap-1 rounded-md border-2 border-border bg-secondary-background px-1.5 h-6 tracking-tight text-foreground font-semibold"
    >
      <lucide-icon name="bell" class="h-3 w-3" />
      <span class="readout text-xs">{{ label() }}</span>
    </span>
  `,
})
export class AlarmBadgeComponent {
  readonly alarm = input.required<AlarmSpec>();

  protected readonly label = computed(() => formatAlarmTime(this.alarm().firesAt));
}
