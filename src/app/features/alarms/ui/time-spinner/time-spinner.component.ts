import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export interface TimeOfDay {
  hour: number;
  minute: number;
}

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));
const wrap = (n: number, mod: number): number => ((n % mod) + mod) % mod;

@Component({
  selector: 'app-time-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './time-spinner.component.html',
})
export class TimeSpinnerComponent {
  readonly value = input.required<TimeOfDay>();

  readonly valueChange = output<TimeOfDay>();

  private readonly hourEl = viewChild<ElementRef<HTMLInputElement>>('hourInput');
  private readonly minuteEl = viewChild<ElementRef<HTMLInputElement>>('minuteInput');

  protected readonly hourDisplay = computed(() => {
    const h = this.value().hour % 12;
    return String(h === 0 ? 12 : h).padStart(2, '0');
  });

  protected readonly minuteDisplay = computed(() => String(this.value().minute).padStart(2, '0'));

  protected readonly isPm = computed(() => this.value().hour >= 12);

  protected readonly meridiemClass = computed<string>(() => {
    const base =
      'inline-flex h-14 w-14 items-center justify-center rounded-md border-2 border-border text-base font-bold tracking-tight cursor-pointer select-none transition-colors';
    return this.isPm()
      ? `${base} bg-primary text-primary-foreground`
      : `${base} bg-secondary-background text-foreground`;
  });

  constructor() {
    effect(() => this.syncIfBlurred(this.hourEl(), this.hourDisplay()));
    effect(() => this.syncIfBlurred(this.minuteEl(), this.minuteDisplay()));
    afterNextRender(() => {
      const el = this.hourEl()?.nativeElement;
      if (!el) return;
      el.focus();
      el.select();
    });
  }

  protected adjustHour(delta: number): void {
    const next = wrap(this.value().hour + delta, 24);
    this.emit(next, this.value().minute);
  }

  protected adjustMinute(delta: number): void {
    const totalMinutes = this.value().hour * 60 + this.value().minute + delta;
    const wrapped = wrap(totalMinutes, 24 * 60);
    this.emit(Math.floor(wrapped / 60), wrapped % 60);
  }

  protected toggleMeridiem(): void {
    this.emit(wrap(this.value().hour + 12, 24), this.value().minute);
  }

  protected onHourInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(-2);
    if (!digits) return;

    const n = parseInt(digits, 10);
    if (digits.length === 1 && n === 0) {
      input.value = '';
      return;
    }

    const twelveHour = clamp(n, 1, 12);
    const pm = this.isPm();
    const hour = twelveHour === 12 ? (pm ? 12 : 0) : pm ? twelveHour + 12 : twelveHour;
    this.emit(hour, this.value().minute);

    const isComplete = digits.length === 2 || (digits.length === 1 && n >= 2);
    if (isComplete) {
      input.value = String(twelveHour).padStart(2, '0');
      this.focusMinute();
    }
  }

  protected onMinuteInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(-2);
    if (!digits) return;
    const minute = clamp(parseInt(digits, 10), 0, 59);
    this.emit(this.value().hour, minute);
  }

  protected onSegmentFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  protected onSegmentBlur(event: FocusEvent, kind: 'hour' | 'minute'): void {
    const input = event.target as HTMLInputElement;
    input.value = kind === 'hour' ? this.hourDisplay() : this.minuteDisplay();
  }

  private focusMinute(): void {
    const el = this.minuteEl()?.nativeElement;
    if (!el) return;
    el.focus();
    el.select();
  }

  private syncIfBlurred(ref: ElementRef<HTMLInputElement> | undefined, text: string): void {
    const el = ref?.nativeElement;
    if (!el) return;
    if (document.activeElement === el) return;
    el.value = text;
  }

  private emit(hour: number, minute: number): void {
    this.valueChange.emit({ hour, minute });
  }
}
