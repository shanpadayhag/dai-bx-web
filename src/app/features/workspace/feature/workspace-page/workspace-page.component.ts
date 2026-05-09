import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { InputDirective } from '@shared/ui/input/input.directive';
import { CardComponent, CardContentComponent } from '@shared/ui/card/card.component';
import type { Group } from '@features/groups/data-access/groups.types';
import { WorkspaceState } from '@features/workspace/data-access/workspace.state';
import { GroupItemComponent } from '@features/workspace/ui/group-item/group-item.component';

@Component({
  selector: 'app-workspace-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    CdkDrag,
    CdkDropList,
    LucideAngularModule,
    ButtonDirective,
    InputDirective,
    CardComponent,
    CardContentComponent,
    GroupItemComponent,
  ],
  templateUrl: './workspace-page.component.html',
})
export class WorkspacePageComponent {
  protected readonly state = inject(WorkspaceState);
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
