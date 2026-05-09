import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LucideIconConfig } from 'lucide-angular';
import { AlarmFiringModalComponent } from '@features/alarms/feature/alarm-firing-modal/alarm-firing-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AlarmFiringModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <app-alarm-firing-modal />
  `,
})
export class App {
  constructor() {
    const lucide = inject(LucideIconConfig);
    lucide.strokeWidth = 2.25;
  }
}
