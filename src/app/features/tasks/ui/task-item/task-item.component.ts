import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { AutofocusDirective } from '@shared/ui/autofocus/autofocus.directive';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { InputDirective } from '@shared/ui/input/input.directive';
import { cn } from '@shared/utils/cn';
import { todayIso } from '@shared/utils/dates';
import { TaskStateService } from '@features/tasks/data-access/tasks.state';
import { isVisibleToday } from '@features/tasks/data-access/tasks.tree';
import type { Task } from '@features/tasks/data-access/tasks.types';

@Component({
  selector: 'app-task-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    LucideAngularModule,
    AutofocusDirective,
    ButtonDirective,
    InputDirective,
  ],
  templateUrl: './task-item.component.html',
  host: {
    class: 'block group/task',
  },
})
export class TaskItemComponent {
  private readonly state = inject(TaskStateService);

  readonly task = input.required<Task>();
  readonly groupId = input.required<string>();

  protected readonly hovered = signal(false);
  protected readonly adding = signal(false);
  protected readonly newSubtaskName = signal('');

  protected readonly visible = computed(() => isVisibleToday(this.task()));

  protected readonly isCompleted = computed(() => this.task().completedDate === todayIso());

  protected readonly sortedChildren = computed(() =>
    this.task()
      .tasks.slice()
      .sort((a, b) => a.order - b.order),
  );

  protected readonly hasSubtasks = computed(() => this.task().tasks.length > 0);

  protected readonly nameClass = computed(() =>
    cn(
      'text-sm flex-1 font-medium transition-all',
      this.isCompleted() && 'line-through text-foreground/40',
    ),
  );

  protected readonly actionsClass = computed(() =>
    cn('flex items-center gap-1 transition-opacity', this.hovered() ? 'opacity-100' : 'opacity-0'),
  );

  protected readonly chevronClass = computed(() =>
    cn('h-4 w-4 transition-transform duration-200', !this.task().isOpen && '-rotate-90'),
  );

  protected readonly completionBtnClass = computed(() =>
    this.isCompleted()
      ? 'h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50'
      : 'h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50',
  );

  protected toggleOpen(): void {
    this.state.toggleTaskOpen(this.groupId(), this.task().id, !this.task().isOpen);
  }

  protected toggleCompletion(): void {
    this.state.toggleTaskCompletion(this.groupId(), this.task().id);
  }

  protected deleteTask(): void {
    this.state.deleteTask(this.groupId(), this.task().id);
  }

  protected toggleAdding(): void {
    this.adding.update((v) => !v);
    if (!this.adding()) this.newSubtaskName.set('');
  }

  protected submitSubtask(event: Event): void {
    event.preventDefault();
    const name = this.newSubtaskName().trim();
    if (!name) return;
    this.state.addSubtask(this.groupId(), this.task().id, name);
    this.newSubtaskName.set('');
    this.adding.set(false);
  }

  protected onSubtaskBlur(): void {
    if (!this.newSubtaskName().trim()) this.adding.set(false);
  }

  protected onChildrenDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.state.reorderTasks(
      this.groupId(),
      this.task().id,
      event.previousIndex,
      event.currentIndex,
    );
  }
}
