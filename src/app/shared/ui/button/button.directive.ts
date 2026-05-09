import { Directive, computed, input } from '@angular/core';
import { cn } from '@shared/utils/cn';

export type ButtonVariant = 'default' | 'ghost' | 'destructive' | 'secondary' | 'outline';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

const VARIANTS: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
};

const SIZES: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3',
  lg: 'h-11 px-8',
  icon: 'h-10 w-10',
};

@Directive({
  selector: 'button[appButton], a[appButton]',
  host: {
    '[class]': 'classes()',
  },
})
export class ButtonDirective {
  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('default');
  readonly btnClass = input<string>('');

  protected readonly classes = computed(() =>
    cn(BASE, VARIANTS[this.variant()], SIZES[this.size()], this.btnClass()),
  );
}
