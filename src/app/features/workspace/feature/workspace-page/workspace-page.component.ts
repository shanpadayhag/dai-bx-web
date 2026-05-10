import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  TemplateRef,
  ViewContainerRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { Overlay, OverlayModule, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { InputDirective } from '@shared/ui/input/input.directive';
import type { Group } from '@features/groups/data-access/groups.types';
import { WorkspaceState } from '@features/workspace/data-access/workspace.state';
import { GroupItemComponent } from '@features/workspace/ui/group-item/group-item.component';
import { ManageGroupsModalComponent } from '@features/workspace/feature/manage-groups-modal/manage-groups-modal.component';

@Component({
  selector: 'app-workspace-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    CdkDrag,
    CdkDropList,
    OverlayModule,
    LucideAngularModule,
    ButtonDirective,
    InputDirective,
    GroupItemComponent,
    ManageGroupsModalComponent,
  ],
  templateUrl: './workspace-page.component.html',
})
export class WorkspacePageComponent {
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = inject(WorkspaceState);
  protected readonly groupName = signal('');
  protected readonly managingGroups = signal(false);

  private readonly manageTpl = viewChild.required<TemplateRef<unknown>>('manageTpl');
  private manageOverlayRef: OverlayRef | null = null;

  protected readonly todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  protected readonly summary = computed(() => {
    const groups = this.state.visibleGroups();
    let tasks = 0;
    for (const g of groups) tasks += this.state.visibleTaskCount(g);
    return { groups: groups.length, tasks };
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.manageOverlayRef?.dispose());
  }

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

  protected openManageGroups(): void {
    if (this.manageOverlayRef) return;
    const positionStrategy = this.overlay
      .position()
      .global()
      .centerHorizontally()
      .centerVertically();
    this.manageOverlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });
    this.manageOverlayRef.attach(new TemplatePortal(this.manageTpl(), this.viewContainerRef));
    this.manageOverlayRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.closeManageGroups());
    this.manageOverlayRef
      .keydownEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          this.closeManageGroups();
        }
      });
    this.managingGroups.set(true);
  }

  protected closeManageGroups(): void {
    this.manageOverlayRef?.dispose();
    this.manageOverlayRef = null;
    this.managingGroups.set(false);
  }

  protected onToggleHidden(payload: { groupId: string; isHidden: boolean }): void {
    this.state.toggleGroupHidden(payload.groupId, payload.isHidden);
  }

  protected onShowAllGroups(): void {
    const allIds = new Set(this.state.groups().map((g) => g.id));
    this.state.setGroupVisibility(allIds);
  }
}
