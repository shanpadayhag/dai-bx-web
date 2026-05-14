import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { cn } from '@shared/utils/cn';
import { formatAlarmTime } from '@features/alarms/data-access/alarm-format';
import type { AlarmSpec } from '@features/alarms/data-access/alarms.types';

@Component({
  selector: 'app-alarm-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <span [class]="badgeClass()">
      <lucide-icon [name]="iconName()" class="h-3 w-3" />
      <span class="readout text-xs">{{ label() }}</span>
    </span>
  `,
})
export class AlarmBadgeComponent {
  readonly alarm = input.required<AlarmSpec>();

  protected readonly label = computed(() => formatAlarmTime(this.alarm().firesAt));

  protected readonly isDisabled = computed(() => this.alarm().enabled === false);

  protected readonly iconName = computed<'bell' | 'bell-off'>(() =>
    this.isDisabled() ? 'bell-off' : 'bell',
  );

  protected readonly badgeClass = computed(() =>
    cn(
      'inline-flex items-center gap-1 rounded-md border-2 border-border px-1.5 h-6 tracking-tight',
      this.isDisabled()
        ? 'bg-secondary-background/50 text-subtle-foreground font-semibold opacity-60'
        : 'bg-secondary-background text-foreground font-semibold',
    ),
  );
}
