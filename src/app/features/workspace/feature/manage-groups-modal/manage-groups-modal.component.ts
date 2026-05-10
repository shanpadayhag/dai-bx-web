import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import type { Group } from '@features/groups/data-access/groups.types';

@Component({
  selector: 'app-manage-groups-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ButtonDirective],
  templateUrl: './manage-groups-modal.component.html',
})
export class ManageGroupsModalComponent {
  readonly groups = input.required<Group[]>();

  readonly toggleHidden = output<{ groupId: string; isHidden: boolean }>();
  readonly showAll = output<void>();
  readonly closed = output<void>();

  protected readonly hiddenCount = computed(() =>
    this.groups().reduce((n, g) => n + (g.isHidden ? 1 : 0), 0),
  );

  protected readonly hasHidden = computed(() => this.hiddenCount() > 0);

  protected onToggle(group: Group, checked: boolean): void {
    this.toggleHidden.emit({ groupId: group.id, isHidden: !checked });
  }

  protected onShowAll(): void {
    this.showAll.emit();
  }

  protected onDone(): void {
    this.closed.emit();
  }
}
