import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonDirective } from '@shared/ui/button/button.directive';
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

  protected readonly focused = this.runner.focusedRun;

  protected readonly isCompleted = computed(() => this.focused()?.run.status === 'completed');
  protected readonly hasMultiple = computed(() => (this.focused()?.total ?? 0) > 1);

  protected readonly statusIcon = computed<'check-circle-2' | 'bell-ring'>(() =>
    this.isCompleted() ? 'check-circle-2' : 'bell-ring',
  );

  protected readonly taskName = computed(() => {
    const f = this.focused();
    if (!f) return '';
    const found = this.tasksState.findTask(f.taskId);
    return found?.task.name ?? '';
  });

  protected readonly counterLabel = computed(() => {
    const f = this.focused();
    return f ? `${f.index + 1} / ${f.total}` : '';
  });

  protected onAdvance(): void {
    const f = this.focused();
    if (f) this.runner.advance(f.taskId);
  }

  protected onCancel(): void {
    const f = this.focused();
    if (f) this.runner.cancel(f.taskId);
  }

  protected onDone(): void {
    const f = this.focused();
    if (f) this.runner.dismiss(f.taskId);
  }

  protected onPrev(): void {
    if (!this.hasMultiple()) return;
    this.runner.focusPrev();
  }

  protected onNext(): void {
    if (!this.hasMultiple()) return;
    this.runner.focusNext();
  }
}
