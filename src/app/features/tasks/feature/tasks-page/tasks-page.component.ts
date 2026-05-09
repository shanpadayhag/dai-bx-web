import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { InputDirective } from '@shared/ui/input/input.directive';
import { CardComponent, CardContentComponent } from '@shared/ui/card/card.component';
import { TaskStateService } from '@features/tasks/data-access/tasks.state';
import type { Group } from '@features/tasks/data-access/tasks.types';
import { GroupItemComponent } from '@features/tasks/ui/group-item/group-item.component';

@Component({
  selector: 'app-tasks-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CdkDrag,
    CdkDropList,
    LucideAngularModule,
    ButtonDirective,
    InputDirective,
    CardComponent,
    CardContentComponent,
    GroupItemComponent,
  ],
  templateUrl: './tasks-page.component.html',
})
export class TasksPageComponent {
  protected readonly state = inject(TaskStateService);
  protected readonly groupName = signal('');

  protected createGroup(event: Event): void {
    event.preventDefault();
    const name = this.groupName().trim();
    if (!name) return;
    this.state.createGroup(name);
    this.groupName.set('');
  }

  protected onGroupDrop(event: CdkDragDrop<Group[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.state.reorderGroups(event.previousIndex, event.currentIndex);
  }
}
