import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { uid } from '@shared/utils/uid';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import {
  DropdownComponent,
  type DropdownOption,
} from '@shared/ui/dropdown/dropdown.component';
import { InputDirective } from '@shared/ui/input/input.directive';
import { primeAudio } from '@features/alarms/data-access/alarm-sound';
import { SoundsState } from '@features/sounds/data-access/sounds.state';
import {
  reindexSets,
  reindexTimers,
  sortedSets,
  sortedTimers,
} from '@features/timers/data-access/timer-format';
import { TimersRunner } from '@features/timers/data-access/timers.runner';
import type { TimerSet, TimerSpec } from '@features/timers/data-access/timers.types';

@Component({
  selector: 'app-timer-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    LucideAngularModule,
    ButtonDirective,
    DropdownComponent,
    InputDirective,
  ],
  templateUrl: './timer-editor.component.html',
})
export class TimerEditorComponent {
  readonly groupId = input.required<string>();
  readonly taskId = input.required<string>();
  readonly timerSets = input.required<TimerSet[]>();
  readonly activeTimerSetId = input<string | null>(null);

  readonly timerSetsChange = output<TimerSet[]>();
  readonly activeTimerSetIdChange = output<string | null>();
  readonly close = output<void>();

  private readonly soundsState = inject(SoundsState);
  private readonly runner = inject(TimersRunner);

  protected readonly sortedSets = computed(() => sortedSets(this.timerSets()));

  protected readonly currentSet = computed<TimerSet | null>(() => {
    const sets = this.sortedSets();
    if (sets.length === 0) return null;
    const activeId = this.activeTimerSetId();
    return sets.find((s) => s.id === activeId) ?? sets[0];
  });

  protected readonly currentTimers = computed(() => {
    const set = this.currentSet();
    return set ? sortedTimers(set.timers) : [];
  });

  protected readonly canStart = computed(() => (this.currentSet()?.timers.length ?? 0) > 0);

  protected readonly soundOptions = computed<DropdownOption[]>(() => [
    { value: '', label: this.defaultLabel() },
    ...this.soundsState.sounds().map((s) => ({ value: s.id, label: s.name })),
  ]);

  private readonly defaultLabel = computed<string>(() => {
    const id = this.soundsState.defaultSoundId();
    if (!id) return 'Default · built-in beep';
    const sound = this.soundsState.sounds().find((s) => s.id === id);
    return sound ? `Default · ${sound.name}` : 'Default';
  });

  protected addSet(): void {
    void primeAudio();
    const sets = this.sortedSets();
    const newSet: TimerSet = {
      id: uid(),
      name: `Version ${sets.length + 1}`,
      order: sets.length,
      autoAdvance: true,
      soundId: null,
      timers: [{ id: uid(), durationMinutes: 5, order: 0 }],
    };
    this.timerSetsChange.emit(reindexSets([...sets, newSet]));
    this.activeTimerSetIdChange.emit(newSet.id);
  }

  protected selectSet(id: string): void {
    this.activeTimerSetIdChange.emit(id);
  }

  protected renameSet(name: string): void {
    const set = this.currentSet();
    if (!set) return;
    this.timerSetsChange.emit(
      this.sortedSets().map((s) => (s.id === set.id ? { ...s, name } : s)),
    );
  }

  protected toggleAutoAdvance(value: boolean): void {
    const set = this.currentSet();
    if (!set) return;
    this.timerSetsChange.emit(
      this.sortedSets().map((s) => (s.id === set.id ? { ...s, autoAdvance: value } : s)),
    );
  }

  protected updateSetSound(soundId: string): void {
    const set = this.currentSet();
    if (!set) return;
    this.timerSetsChange.emit(
      this.sortedSets().map((s) =>
        s.id === set.id ? { ...s, soundId: soundId || null } : s,
      ),
    );
  }

  protected deleteSet(): void {
    const set = this.currentSet();
    if (!set) return;
    const remaining = reindexSets(this.sortedSets().filter((s) => s.id !== set.id));
    this.timerSetsChange.emit(remaining);
    this.activeTimerSetIdChange.emit(remaining[0]?.id ?? null);
  }

  protected addStep(): void {
    void primeAudio();
    const set = this.currentSet();
    if (!set) return;
    const next: TimerSpec = {
      id: uid(),
      durationMinutes: 5,
      order: set.timers.length,
    };
    this.updateSetTimers(set.id, [...set.timers, next]);
  }

  protected updateStepDuration(stepId: string, value: number): void {
    const set = this.currentSet();
    if (!set) return;
    const safe = Math.max(1, Math.min(180, Math.floor(value)));
    this.updateSetTimers(
      set.id,
      set.timers.map((t) => (t.id === stepId ? { ...t, durationMinutes: safe } : t)),
    );
  }

  protected deleteStep(stepId: string): void {
    const set = this.currentSet();
    if (!set) return;
    this.updateSetTimers(
      set.id,
      set.timers.filter((t) => t.id !== stepId),
    );
  }

  protected start(): void {
    const set = this.currentSet();
    if (!set || set.timers.length === 0) return;
    void primeAudio();
    this.runner.start(this.groupId(), this.taskId(), set.id);
    this.close.emit();
  }

  protected onDone(): void {
    this.close.emit();
  }

  protected onManageSounds(): void {
    this.close.emit();
  }

  private updateSetTimers(setId: string, timers: TimerSpec[]): void {
    this.timerSetsChange.emit(
      this.sortedSets().map((s) =>
        s.id === setId ? { ...s, timers: reindexTimers(timers) } : s,
      ),
    );
  }
}
