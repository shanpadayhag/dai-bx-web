import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { AutofocusDirective } from '@shared/ui/autofocus/autofocus.directive';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { InputDirective } from '@shared/ui/input/input.directive';
import { PluralPipe } from '@shared/ui/plural/plural.pipe';
import { CardComponent, CardContentComponent } from '@shared/ui/card/card.component';
import { cn } from '@shared/utils/cn';
import type { Group } from '@features/groups/data-access/groups.types';
import type { Task } from '@features/tasks/data-access/tasks.types';
import { isVisibleToday } from '@features/tasks/data-access/tasks.tree';
import { WorkspaceState } from '@features/workspace/data-access/workspace.state';
import { TaskItemComponent } from '@features/workspace/ui/task-item/task-item.component';

@Component({
  selector: 'app-group-item',
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
    PluralPipe,
    CardComponent,
    CardContentComponent,
    TaskItemComponent,
  ],
  templateUrl: './group-item.component.html',
  host: {
    class: 'block',
  },
})
export class GroupItemComponent {
  private readonly state = inject(WorkspaceState);

  readonly group = input.required<Group>();

  protected readonly hovered = signal(false);
  protected readonly editing = signal(false);
  protected readonly editedName = signal('');
  protected readonly newTaskName = signal('');

  protected readonly visibleTasks = computed(() =>
    this.state
      .tasksFor(this.group().id)
      .filter(isVisibleToday)
      .slice()
      .sort((a, b) => a.order - b.order),
  );

  protected readonly visibleTaskCount = computed(() => this.visibleTasks().length);

  protected readonly deleteBtnClass = computed(() =>
    cn('transition-opacity', this.hovered() ? 'opacity-100' : 'opacity-0'),
  );

  protected toggleOpen(): void {
    this.state.toggleGroupOpen(this.group().id, !this.group().isOpen);
  }

  protected delete(): void {
    this.state.deleteGroup(this.group().id);
  }

  protected startEditing(): void {
    this.editedName.set(this.group().name);
    this.editing.set(true);
  }

  protected saveName(): void {
    if (!this.editing()) return;
    const trimmed = this.editedName().trim();
    if (trimmed && trimmed !== this.group().name) {
      this.state.renameGroup(this.group().id, trimmed);
    }
    this.editing.set(false);
  }

  protected onEditKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.saveName();
    if (event.key === 'Escape') {
      this.editedName.set(this.group().name);
      this.editing.set(false);
    }
  }

  protected addTask(event: Event): void {
    event.preventDefault();
    const name = this.newTaskName().trim();
    if (!name) return;
    this.state.addRootTask(this.group().id, name);
    this.newTaskName.set('');
  }

  protected onTaskDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.state.reorderTasks(this.group().id, null, event.previousIndex, event.currentIndex);
  }
}
