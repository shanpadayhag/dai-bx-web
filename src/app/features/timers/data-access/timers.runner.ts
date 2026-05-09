import { Injectable, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { playBeep, playSoundBlob, stopAlarm } from '@features/alarms/data-access/alarm-sound';
import { SoundsState } from '@features/sounds/data-access/sounds.state';
import { TasksState } from '@features/tasks/data-access/tasks.state';
import type { TimerRun, TimerSet, TimerSpec } from '@features/timers/data-access/timers.types';

const STORAGE_KEY = 'daibx_timer_run';

type ActiveRun = Exclude<TimerRun, { status: 'idle' }>;

@Injectable({ providedIn: 'root' })
export class TimersRunner implements OnDestroy {
  private readonly tasksState = inject(TasksState);
  private readonly soundsState = inject(SoundsState);

  private readonly _run = signal<TimerRun>(loadFromStorage());
  private readonly _now = signal(Date.now());

  readonly run = this._run.asReadonly();

  readonly currentStep = computed<{ set: TimerSet; step: TimerSpec; index: number } | null>(() => {
    const r = this._run();
    if (r.status === 'idle' || r.status === 'completed') return null;
    const set = this.findTimerSet(r);
    if (!set) return null;
    const idx = r.status === 'running' ? r.currentIndex : r.completedIndex;
    const step = set.timers[idx];
    if (!step) return null;
    return { set, step, index: idx };
  });

  readonly remainingSeconds = computed<number | null>(() => {
    const r = this._run();
    if (r.status !== 'running') return null;
    const set = this.findTimerSet(r);
    const step = set?.timers[r.currentIndex];
    if (!step) return null;
    const endMs = Date.parse(r.stepStartedAt) + step.durationMinutes * 60_000;
    return (endMs - this._now()) / 1000;
  });

  private fireTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private tickIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => saveToStorage(this._run()));

    effect(() => {
      if (!this.tasksState.isLoaded()) return;
      const r = this._run();
      if (r.status === 'idle' || r.status === 'completed') return;
      if (!this.findTimerSet(r)) this._run.set({ status: 'idle' });
    });

    effect(() => {
      const r = this._run();
      this.clearFireTimeout();
      this.stopTick();
      if (r.status !== 'running') return;
      const set = this.findTimerSet(r);
      const step = set?.timers[r.currentIndex];
      if (!step) return;
      const endMs = Date.parse(r.stepStartedAt) + step.durationMinutes * 60_000;
      const delay = Math.max(0, endMs - Date.now());
      this.fireTimeoutId = setTimeout(() => this.handleStepEnd(), delay);
      this.startTick();
    });
  }

  ngOnDestroy(): void {
    this.clearFireTimeout();
    this.stopTick();
    stopAlarm();
  }

  start(groupId: string, taskId: string, timerSetId: string): void {
    const found = this.tasksState.findTask(taskId);
    const set = found?.task.timerSets.find((s) => s.id === timerSetId);
    if (!set || set.timers.length === 0) return;
    stopAlarm();
    this._run.set({
      status: 'running',
      taskId,
      groupId,
      timerSetId,
      currentIndex: 0,
      stepStartedAt: new Date().toISOString(),
    });
  }

  advance(): void {
    const r = this._run();
    if (r.status !== 'awaitingAdvance') return;
    const set = this.findTimerSet(r);
    if (!set) {
      this._run.set({ status: 'idle' });
      return;
    }
    stopAlarm();
    const nextIndex = r.completedIndex + 1;
    if (nextIndex >= set.timers.length) {
      this._run.set({
        status: 'completed',
        taskId: r.taskId,
        groupId: r.groupId,
        timerSetId: r.timerSetId,
        finishedAt: new Date().toISOString(),
      });
      return;
    }
    this._run.set({
      status: 'running',
      taskId: r.taskId,
      groupId: r.groupId,
      timerSetId: r.timerSetId,
      currentIndex: nextIndex,
      stepStartedAt: new Date().toISOString(),
    });
  }

  cancel(): void {
    stopAlarm();
    this._run.set({ status: 'idle' });
  }

  dismiss(): void {
    stopAlarm();
    this._run.set({ status: 'idle' });
  }

  private handleStepEnd(): void {
    const r = this._run();
    if (r.status !== 'running') return;
    const set = this.findTimerSet(r);
    const step = set?.timers[r.currentIndex];
    if (!set || !step) {
      this._run.set({ status: 'idle' });
      return;
    }
    void this.playForSet(set.soundId);

    const isLast = r.currentIndex >= set.timers.length - 1;
    if (isLast) {
      this._run.set({
        status: 'completed',
        taskId: r.taskId,
        groupId: r.groupId,
        timerSetId: r.timerSetId,
        finishedAt: new Date().toISOString(),
      });
      return;
    }
    if (set.autoAdvance) {
      this._run.set({
        status: 'running',
        taskId: r.taskId,
        groupId: r.groupId,
        timerSetId: r.timerSetId,
        currentIndex: r.currentIndex + 1,
        stepStartedAt: new Date().toISOString(),
      });
      return;
    }
    this._run.set({
      status: 'awaitingAdvance',
      taskId: r.taskId,
      groupId: r.groupId,
      timerSetId: r.timerSetId,
      completedIndex: r.currentIndex,
      finishedAt: new Date().toISOString(),
    });
  }

  private async playForSet(setSoundId: string | null): Promise<void> {
    const candidateIds = [setSoundId, this.soundsState.defaultSoundId()];
    for (const id of candidateIds) {
      if (!id) continue;
      const blob = await this.soundsState.getBlob(id);
      if (blob) {
        playSoundBlob(blob);
        return;
      }
    }
    playBeep();
  }

  private findTimerSet(r: ActiveRun): TimerSet | null {
    const found = this.tasksState.findTask(r.taskId);
    return found?.task.timerSets.find((s) => s.id === r.timerSetId) ?? null;
  }

  private startTick(): void {
    this.stopTick();
    this._now.set(Date.now());
    this.tickIntervalId = setInterval(() => this._now.set(Date.now()), 1000);
  }

  private stopTick(): void {
    if (this.tickIntervalId !== null) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
  }

  private clearFireTimeout(): void {
    if (this.fireTimeoutId !== null) {
      clearTimeout(this.fireTimeoutId);
      this.fireTimeoutId = null;
    }
  }
}

const isTimerRun = (value: unknown): value is TimerRun => {
  if (!value || typeof value !== 'object') return false;
  const status = (value as { status?: unknown }).status;
  return (
    status === 'idle' ||
    status === 'running' ||
    status === 'awaitingAdvance' ||
    status === 'completed'
  );
};

const loadFromStorage = (): TimerRun => {
  if (typeof localStorage === 'undefined') return { status: 'idle' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { status: 'idle' };
    const parsed: unknown = JSON.parse(raw);
    return isTimerRun(parsed) ? parsed : { status: 'idle' };
  } catch {
    return { status: 'idle' };
  }
};

const saveToStorage = (run: TimerRun): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    if (run.status === 'idle') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
  } catch {
    /* quota or unavailable */
  }
};
