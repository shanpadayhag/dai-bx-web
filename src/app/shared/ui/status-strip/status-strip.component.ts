import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { formatAlarmTime } from '@features/alarms/data-access/alarm-format';
import { formatRemaining } from '@features/timers/data-access/timer-format';
import { TimersRunner } from '@features/timers/data-access/timers.runner';
import { WorkspaceState } from '@features/workspace/data-access/workspace.state';

const pad = (n: number): string => String(n).padStart(2, '0');

@Component({
  selector: 'app-status-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './status-strip.component.html',
})
export class StatusStripComponent {
  private readonly workspace = inject(WorkspaceState);
  private readonly runner = inject(TimersRunner);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _now = signal(new Date());

  protected readonly clockTime = computed(() => {
    const d = this._now();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  });

  protected readonly nextAlarm = computed(() => {
    const next = this.workspace.nextAlarm();
    if (!next || !next.task.alarm) return null;
    return {
      time: formatAlarmTime(next.task.alarm.firesAt).replace(/^(Today|Tomorrow) /, ''),
      taskName: next.task.name,
    };
  });

  protected readonly timerRun = this.runner.run;

  protected readonly hasActiveTimer = computed(() => this.timerRun().status === 'running');

  protected readonly timerRemaining = computed(() => {
    const s = this.runner.remainingSeconds();
    return s === null ? '00:00' : formatRemaining(s);
  });

  protected readonly timerStepBadge = computed(() => {
    const step = this.runner.currentStep();
    if (!step) return '';
    return `${step.index + 1}/${step.set.timers.length}`;
  });

  constructor() {
    const intervalId = setInterval(() => this._now.set(new Date()), 1000);
    this.destroyRef.onDestroy(() => clearInterval(intervalId));
  }
}
