import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { formatRemaining } from '@features/timers/data-access/timer-format';
import { TimersRunner } from '@features/timers/data-access/timers.runner';
import { TasksState } from '@features/tasks/data-access/tasks.state';

@Component({
  selector: 'app-timer-running-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ButtonDirective],
  templateUrl: './timer-running-banner.component.html',
})
export class TimerRunningBannerComponent {
  private readonly runner = inject(TimersRunner);
  private readonly tasksState = inject(TasksState);

  protected readonly run = this.runner.run;
  protected readonly currentStep = this.runner.currentStep;
  protected readonly remainingSeconds = this.runner.remainingSeconds;

  protected readonly isVisible = computed(() => {
    const status = this.run().status;
    return status === 'awaitingAdvance' || status === 'completed';
  });
  protected readonly isRunning = computed(() => this.run().status === 'running');
  protected readonly isCompleted = computed(() => this.run().status === 'completed');

  protected readonly statusIcon = computed<'timer' | 'check-circle-2' | 'bell-ring'>(() => {
    const status = this.run().status;
    if (status === 'running') return 'timer';
    if (status === 'completed') return 'check-circle-2';
    return 'bell-ring';
  });

  protected readonly remainingLabel = computed(() => {
    const s = this.remainingSeconds();
    return s === null ? '00:00' : formatRemaining(s);
  });

  protected readonly stepBadge = computed(() => {
    const step = this.currentStep();
    if (!step) return '';
    return `${step.index + 1}/${step.set.timers.length} · ${step.step.durationMinutes}M`;
  });

  protected readonly taskName = computed(() => {
    const r = this.run();
    if (r.status === 'idle') return '';
    const found = this.tasksState.findTask(r.taskId);
    return found?.task.name ?? '';
  });

  protected onAdvance(): void {
    this.runner.advance();
  }

  protected onCancel(): void {
    this.runner.cancel();
  }

  protected onDone(): void {
    this.runner.dismiss();
  }
}
