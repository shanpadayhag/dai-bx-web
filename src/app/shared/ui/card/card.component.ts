import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col',
  },
})
export class CardComponent {}

@Component({
  selector: 'app-card-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'p-6',
  },
})
export class CardContentComponent {}
