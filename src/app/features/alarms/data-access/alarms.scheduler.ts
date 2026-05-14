import { Injectable, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { playBeep, playSoundBlob, stopAlarm } from '@features/alarms/data-access/alarm-sound';
import { SoundsState } from '@features/sounds/data-access/sounds.state';
import { TasksState } from '@features/tasks/data-access/tasks.state';
import type { Task } from '@features/tasks/data-access/tasks.types';

const DAY_MS = 86_400_000;

export interface FiringAlarm {
  task: Task;
  groupId: string;
}

@Injectable({ providedIn: 'root' })
export class AlarmsScheduler implements OnDestroy {
  private readonly tasksState = inject(TasksState);
  private readonly soundsState = inject(SoundsState);

  private readonly _firing = signal<FiringAlarm | null>(null);

  readonly firing = this._firing.asReadonly();

  private timerId: ReturnType<typeof setTimeout> | null = null;

  private readonly nextDue = computed<{ task: Task; groupId: string; at: number } | null>(() => {
    let best: { task: Task; groupId: string; at: number } | null = null;
    for (const entry of this.tasksState.tasksWithAlarm()) {
      const alarm = entry.task.alarm;
      if (!alarm || !alarm.enabled) continue;
      const at = Date.parse(alarm.firesAt);
      if (Number.isNaN(at)) continue;
      if (!best || at < best.at) best = { task: entry.task, groupId: entry.groupId, at };
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

  private fire(entry: { task: Task; groupId: string }): void {
    const found = this.tasksState.findTask(entry.task.id);
    if (!found) return;
    const alarm = found.task.alarm;
    if (!alarm) return;

    this._firing.set({ task: found.task, groupId: entry.groupId });
    void this.playForAlarm(alarm.soundId);

    if (alarm.repeat === 'daily') {
      let nextMs = Date.parse(alarm.firesAt);
      if (Number.isNaN(nextMs)) return;
      do {
        nextMs += DAY_MS;
      } while (nextMs <= Date.now());
      this.tasksState.setAlarm(entry.groupId, entry.task.id, {
        ...alarm,
        firesAt: new Date(nextMs).toISOString(),
      });
      return;
    }

    this.tasksState.setAlarm(entry.groupId, entry.task.id, { ...alarm, enabled: false });
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
