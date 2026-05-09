import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { PluralPipe } from '@shared/ui/plural/plural.pipe';
import { CardComponent, CardContentComponent } from '@shared/ui/card/card.component';
import type { Task } from '@features/tasks/data-access/tasks.types';
import {
  WorkspaceState,
  type LegacyGroupView,
} from '@features/workspace/data-access/workspace.state';

type Status = 'loading' | 'available' | 'empty' | 'imported' | 'error';

@Component({
  selector: 'app-import-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LucideAngularModule,
    ButtonDirective,
    PluralPipe,
    CardComponent,
    CardContentComponent,
  ],
  templateUrl: './import-page.component.html',
})
export class ImportPageComponent {
  private readonly state = inject(WorkspaceState);

  protected readonly status = signal<Status>('loading');
  protected readonly busy = signal(false);
  protected readonly legacy = signal<LegacyGroupView[] | null>(null);

  protected readonly groupCount = computed(() => this.legacy()?.length ?? 0);

  protected readonly taskCount = computed(() => {
    const groups = this.legacy();
    if (!groups) return 0;
    return groups.reduce((sum, g) => sum + this.countTasks(g.tasks), 0);
  });

  constructor() {
    void this.detect();
  }

  protected async runImport(): Promise<void> {
    const data = this.legacy();
    if (!data || this.busy()) return;
    this.busy.set(true);
    try {
      await this.state.importLegacy(data);
      this.status.set('imported');
    } catch {
      this.status.set('error');
    } finally {
      this.busy.set(false);
    }
  }

  protected async discard(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.state.dismissLegacy();
      this.status.set('empty');
      this.legacy.set(null);
    } finally {
      this.busy.set(false);
    }
  }

  private async detect(): Promise<void> {
    try {
      const data = await this.state.previewLegacy();
      if (!data) {
        this.status.set('empty');
        return;
      }
      this.legacy.set(data);
      this.status.set('available');
    } catch {
      this.status.set('error');
    }
  }

  private countTasks(tasks: Task[]): number {
    let total = tasks.length;
    for (const t of tasks) total += this.countTasks(t.tasks);
    return total;
  }
}
