import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LucideIconConfig } from 'lucide-angular';
import { AlarmFiringModalComponent } from '@features/alarms/feature/alarm-firing-modal/alarm-firing-modal.component';
import { TimerRunningBannerComponent } from '@features/timers/feature/timer-running-banner/timer-running-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AlarmFiringModalComponent, TimerRunningBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <app-alarm-firing-modal />
    <app-timer-running-banner />
  `,
})
export class App {
  constructor() {
    const lucide = inject(LucideIconConfig);
    lucide.strokeWidth = 2.25;
  }
}
