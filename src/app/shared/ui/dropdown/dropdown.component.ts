import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { OverlayModule, type ConnectedPosition } from '@angular/cdk/overlay';
import { LucideAngularModule } from 'lucide-angular';

export interface DropdownOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OverlayModule, LucideAngularModule],
  templateUrl: './dropdown.component.html',
})
export class DropdownComponent {
  readonly options = input.required<DropdownOption[]>();
  readonly value = input<string>('');
  readonly placeholder = input<string>('Select…');

  readonly valueChange = output<string>();

  private readonly triggerEl = viewChild<ElementRef<HTMLButtonElement>>('triggerEl');

  protected readonly open = signal(false);
  protected readonly triggerWidth = signal(0);

  protected readonly selectedLabel = computed<string>(() => {
    const current = this.options().find((o) => o.value === this.value());
    return current?.label ?? this.placeholder();
  });

  protected readonly positions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -6,
    },
  ];

  protected toggle(): void {
    if (!this.open()) {
      this.triggerWidth.set(this.triggerEl()?.nativeElement.offsetWidth ?? 0);
    }
    this.open.update((v) => !v);
  }

  protected select(value: string): void {
    this.valueChange.emit(value);
    this.open.set(false);
    this.triggerEl()?.nativeElement.focus();
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.open.set(false);
      this.triggerEl()?.nativeElement.focus();
    }
  }
}
