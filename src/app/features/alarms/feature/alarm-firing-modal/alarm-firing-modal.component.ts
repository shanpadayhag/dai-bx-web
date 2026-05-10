import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { formatAlarmTime } from '@features/alarms/data-access/alarm-format';
import { AlarmsScheduler } from '@features/alarms/data-access/alarms.scheduler';
import { WorkspaceState } from '@features/workspace/data-access/workspace.state';

@Component({
  selector: 'app-alarm-firing-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ButtonDirective],
  templateUrl: './alarm-firing-modal.component.html',
})
export class AlarmFiringModalComponent {
  private readonly scheduler = inject(AlarmsScheduler);
  private readonly workspace = inject(WorkspaceState);

  protected readonly firing = this.scheduler.firing;

  protected readonly firingTime = computed(() => {
    const iso = this.firing()?.task.alarm?.firesAt;
    if (!iso) return '';
    return formatAlarmTime(iso).replace(/^(Today|Tomorrow) /, '');
  });

  protected onDone(): void {
    const f = this.firing();
    if (!f) return;
    this.workspace.toggleTaskCompletion(f.groupId, f.task.id);
    this.workspace.setTaskAlarm(f.groupId, f.task.id, null);
    this.scheduler.dismiss();
  }

  protected onDismiss(): void {
    const f = this.firing();
    if (!f) return;
    this.workspace.setTaskAlarm(f.groupId, f.task.id, null);
    this.scheduler.dismiss();
  }
}
