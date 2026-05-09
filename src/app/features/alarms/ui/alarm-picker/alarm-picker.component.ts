import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import {
  DropdownComponent,
  type DropdownOption,
} from '@shared/ui/dropdown/dropdown.component';
import {
  formatAlarmTime,
  isTomorrow,
  nextOccurrenceIso,
  parseHourMinute,
} from '@features/alarms/data-access/alarm-format';
import { primeAudio } from '@features/alarms/data-access/alarm-sound';
import type { AlarmSpec } from '@features/alarms/data-access/alarms.types';
import {
  TimeSpinnerComponent,
  type TimeOfDay,
} from '@features/alarms/ui/time-spinner/time-spinner.component';
import { SoundsState } from '@features/sounds/data-access/sounds.state';

const defaultDraft = (now: Date = new Date()): TimeOfDay => {
  const next = new Date(now.getTime() + 30 * 60_000);
  return { hour: next.getHours(), minute: 0 };
};

@Component({
  selector: 'app-alarm-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LucideAngularModule,
    ButtonDirective,
    DropdownComponent,
    TimeSpinnerComponent,
  ],
  templateUrl: './alarm-picker.component.html',
})
export class AlarmPickerComponent {
  readonly alarm = input<AlarmSpec | null>(null);

  readonly alarmChange = output<AlarmSpec | null>();
  readonly close = output<void>();

  private readonly soundsState = inject(SoundsState);

  protected readonly sounds = this.soundsState.sounds;
  protected readonly defaultSoundId = this.soundsState.defaultSoundId;

  protected readonly draft = signal<TimeOfDay>(defaultDraft());

  protected readonly currentTime = computed<TimeOfDay>(() => {
    return parseHourMinute(this.alarm()?.firesAt ?? null) ?? this.draft();
  });

  protected readonly currentSoundId = computed<string>(() => this.alarm()?.soundId ?? '');

  protected readonly defaultLabel = computed<string>(() => {
    const id = this.defaultSoundId();
    if (!id) return 'Default · built-in beep';
    const sound = this.sounds().find((s) => s.id === id);
    return sound ? `Default · ${sound.name}` : 'Default';
  });

  protected readonly soundOptions = computed<DropdownOption[]>(() => [
    { value: '', label: this.defaultLabel() },
    ...this.sounds().map((s) => ({ value: s.id, label: s.name })),
  ]);

  protected readonly previewLabel = computed<string>(() => {
    const t = this.currentTime();
    const iso = nextOccurrenceIso(t.hour, t.minute);
    const time = formatAlarmTime(iso);
    return isTomorrow(iso) ? `Tomorrow at ${time.replace(/^Tomorrow /, '')}` : `Today at ${time}`;
  });

  protected onTimeChange(value: TimeOfDay): void {
    void primeAudio();
    this.draft.set(value);
    this.alarmChange.emit({
      firesAt: nextOccurrenceIso(value.hour, value.minute),
      soundId: this.alarm()?.soundId ?? null,
    });
  }

  protected onSoundChange(value: string): void {
    const soundId = value || null;
    const current = this.alarm();
    const t = this.currentTime();
    const firesAt = current?.firesAt ?? nextOccurrenceIso(t.hour, t.minute);
    this.alarmChange.emit({ firesAt, soundId });
  }

  protected onClear(): void {
    this.alarmChange.emit(null);
    this.close.emit();
  }

  protected onDone(): void {
    this.close.emit();
  }

  protected onManage(): void {
    this.close.emit();
  }
}
