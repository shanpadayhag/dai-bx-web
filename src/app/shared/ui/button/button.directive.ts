import { Directive, computed, input } from '@angular/core';
import { cn } from '@shared/utils/cn';

export type ButtonVariant = 'default' | 'neutral' | 'ghost' | 'destructive' | 'success' | 'warning';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold tracking-tight rounded-md text-sm disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

const BORDERED = 'border-2 border-border shadow-brutal brutal-press';

const VARIANTS: Record<ButtonVariant, string> = {
  default: `bg-primary text-primary-foreground ${BORDERED}`,
  neutral: `bg-secondary-background text-foreground ${BORDERED}`,
  destructive: `bg-destructive text-destructive-foreground ${BORDERED}`,
  success: `bg-success text-success-foreground ${BORDERED}`,
  warning: `bg-warning text-warning-foreground ${BORDERED}`,
  ghost: 'text-foreground hover:bg-foreground/5 transition-colors',
};

const SIZES: Record<ButtonSize, string> = {
  default: 'h-10 px-4',
  sm: 'h-9 px-3',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
  'icon-sm': 'h-8 w-8',
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
