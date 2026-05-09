import { Injectable, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { TasksState } from '@features/tasks/data-access/tasks.state';
import type { Task } from '@features/tasks/data-access/tasks.types';
import { playBeep, playSoundBlob, stopAlarm } from '@features/alarms/data-access/alarm-sound';
import { SoundsState } from '@features/sounds/data-access/sounds.state';

export interface FiringAlarm {
  task: Task;
  groupId: string;
}

@Injectable({ providedIn: 'root' })
export class AlarmsScheduler implements OnDestroy {
  private readonly tasksState = inject(TasksState);
  private readonly soundsState = inject(SoundsState);

  private readonly _firing = signal<FiringAlarm | null>(null);
  private readonly _firedKeys = signal<Set<string>>(new Set());

  readonly firing = this._firing.asReadonly();

  private timerId: ReturnType<typeof setTimeout> | null = null;

  private readonly nextDue = computed<{ task: Task; groupId: string; at: number; key: string } | null>(() => {
    const fired = this._firedKeys();
    let best: { task: Task; groupId: string; at: number; key: string } | null = null;
    for (const entry of this.tasksState.tasksWithAlarm()) {
      const alarm = entry.task.alarm;
      if (!alarm) continue;
      const key = `${entry.task.id}:${alarm.firesAt}`;
      if (fired.has(key)) continue;
      const at = Date.parse(alarm.firesAt);
      if (Number.isNaN(at)) continue;
      if (!best || at < best.at) best = { ...entry, at, key };
    }
    return best;
  });

  constructor() {
    effect(() => {
      const next = this.nextDue();
      this.clearTimer();
      if (!next) return;
      const delay = Math.max(0, next.at - Date.now());
      this.timerId = setTimeout(() => this.fire(next), delay);
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
    stopAlarm();
  }

  dismiss(): void {
    stopAlarm();
    this._firing.set(null);
  }

  private fire(entry: { task: Task; groupId: string; key: string }): void {
    this._firedKeys.update((set) => {
      const next = new Set(set);
      next.add(entry.key);
      return next;
    });
    this._firing.set({ task: entry.task, groupId: entry.groupId });
    void this.playForAlarm(entry.task.alarm?.soundId ?? null);
  }

  private async playForAlarm(taskSoundId: string | null): Promise<void> {
    const candidateIds = [taskSoundId, this.soundsState.defaultSoundId()];
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

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
