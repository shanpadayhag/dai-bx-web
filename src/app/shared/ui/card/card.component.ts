import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class:
      'block rounded-lg border-2 border-border bg-secondary-background text-foreground shadow-brutal',
  },
})
export class CardComponent {}

@Component({
  selector: 'app-card-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'block p-5',
  },
})
export class CardContentComponent {}
