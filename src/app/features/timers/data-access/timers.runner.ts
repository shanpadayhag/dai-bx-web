import { Injectable, OnDestroy, Signal, computed, effect, inject, signal } from '@angular/core';
import { playRunBeep, playRunSound, type RunSoundHandle } from '@features/alarms/data-access/alarm-sound';
import { SoundsState } from '@features/sounds/data-access/sounds.state';
import { TasksState } from '@features/tasks/data-access/tasks.state';
import {
  isActiveRun,
  isLegacyTimerRun,
  type ActiveRun,
  type LegacyTimerRun,
  type TimerRunsMap,
  type TimerSet,
  type TimerSpec,
} from '@features/timers/data-access/timers.types';

const STORAGE_KEY = 'daibx_timer_runs';
const LEGACY_STORAGE_KEY = 'daibx_timer_run';
const STORAGE_VERSION = 2;

type RunningRun = Extract<ActiveRun, { status: 'running' }>;

export interface RunWithKey {
  taskId: string;
  run: ActiveRun;
}

export interface StepInfo {
  set: TimerSet;
  step: TimerSpec;
  index: number;
}

export interface FocusedRun {
  taskId: string;
  run: ActiveRun;
  index: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class TimersRunner implements OnDestroy {
  private readonly tasksState = inject(TasksState);
  private readonly soundsState = inject(SoundsState);

  private readonly _runs = signal<TimerRunsMap>(loadFromStorage());
  private readonly _now = signal(Date.now());
  private readonly _focusedTaskId = signal<string | null>(null);

  readonly runs: Signal<TimerRunsMap> = this._runs.asReadonly();

  readonly runningRuns = computed<RunWithKey[]>(() => {
    const map = this._runs();
    const out: { entry: RunWithKey; endMs: number }[] = [];
    for (const taskId of Object.keys(map)) {
      const run = map[taskId];
      if (run.status !== 'running') continue;
      const step = this.findStep(run);
      if (!step) continue;
      const endMs = Date.parse(run.stepStartedAt) + step.step.durationMinutes * 60_000;
      out.push({ entry: { taskId, run }, endMs });
    }
    out.sort((a, b) => a.endMs - b.endMs);
    return out.map((o) => o.entry);
  });

  readonly attentionRuns = computed<RunWithKey[]>(() => {
    const map = this._runs();
    const out: RunWithKey[] = [];
    for (const taskId of Object.keys(map)) {
      const run = map[taskId];
      if (run.status === 'awaitingAdvance' || run.status === 'completed') {
        out.push({ taskId, run });
      }
    }
    out.sort((a, b) => {
      const ta = 'finishedAt' in a.run ? Date.parse(a.run.finishedAt) : 0;
      const tb = 'finishedAt' in b.run ? Date.parse(b.run.finishedAt) : 0;
      return ta - tb;
    });
    return out;
  });

  readonly focusedRun = computed<FocusedRun | null>(() => {
    const list = this.attentionRuns();
    if (list.length === 0) return null;
    const id = this._focusedTaskId();
    const idx = id === null ? 0 : list.findIndex((r) => r.taskId === id);
    const safeIdx = idx === -1 ? 0 : idx;
    const pick = list[safeIdx];
    return { taskId: pick.taskId, run: pick.run, index: safeIdx, total: list.length };
  });

  private readonly fireTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly scheduledKeys = new Map<string, string>();
  private readonly soundHandles = new Map<string, RunSoundHandle>();
  private tickIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => saveToStorage(this._runs()));

    effect(() => {
      if (!this.tasksState.isLoaded()) return;
      const map = this._runs();
      const stale: string[] = [];
      for (const taskId of Object.keys(map)) {
        if (!this.findTimerSet(map[taskId])) stale.push(taskId);
      }
      if (stale.length === 0) return;
      this._runs.update((m) => {
        const next = { ...m };
        for (const id of stale) delete next[id];
        return next;
      });
    });

    effect(() => {
      const map = this._runs();
      const desired = new Map<string, RunningRun>();
      for (const taskId of Object.keys(map)) {
        const run = map[taskId];
        if (run.status === 'running') desired.set(taskId, run);
      }
      for (const [taskId, fp] of Array.from(this.scheduledKeys.entries())) {
        const run = desired.get(taskId);
        if (!run || fp !== run.stepStartedAt) {
          const handle = this.fireTimeouts.get(taskId);
          if (handle !== undefined) clearTimeout(handle);
          this.fireTimeouts.delete(taskId);
          this.scheduledKeys.delete(taskId);
        }
      }
      for (const [taskId, run] of desired) {
        if (this.scheduledKeys.get(taskId) === run.stepStartedAt) continue;
        this.scheduleFire(taskId, run);
        this.scheduledKeys.set(taskId, run.stepStartedAt);
      }
    });

    effect(() => {
      const hasRunning = this.runningRuns().length > 0;
      if (hasRunning && this.tickIntervalId === null) {
        this._now.set(Date.now());
        this.tickIntervalId = setInterval(() => this._now.set(Date.now()), 1000);
      } else if (!hasRunning && this.tickIntervalId !== null) {
        clearInterval(this.tickIntervalId);
        this.tickIntervalId = null;
      }
    });

    effect(() => {
      const list = this.attentionRuns();
      const id = this._focusedTaskId();
      if (list.length === 0) {
        if (id !== null) this._focusedTaskId.set(null);
        return;
      }
      if (id === null || !list.some((r) => r.taskId === id)) {
        this._focusedTaskId.set(list[0].taskId);
      }
    });

    effect(() => {
      const map = this._runs();
      const wanted = new Set<string>();
      for (const taskId of Object.keys(map)) {
        const run = map[taskId];
        if (run.status === 'awaitingAdvance' || run.status === 'completed') wanted.add(taskId);
      }
      for (const taskId of Array.from(this.soundHandles.keys())) {
        if (!wanted.has(taskId)) this.stopSoundFor(taskId);
      }
    });
  }

  ngOnDestroy(): void {
    for (const id of this.fireTimeouts.values()) clearTimeout(id);
    this.fireTimeouts.clear();
    this.scheduledKeys.clear();
    if (this.tickIntervalId !== null) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
    for (const handle of this.soundHandles.values()) handle.stop();
    this.soundHandles.clear();
  }

  runForTask(taskId: string): ActiveRun | null {
    return this._runs()[taskId] ?? null;
  }

  remainingSecondsFor(taskId: string): number | null {
    const run = this._runs()[taskId];
    if (!run || run.status !== 'running') return null;
    const step = this.findStep(run);
    if (!step) return null;
    const endMs = Date.parse(run.stepStartedAt) + step.step.durationMinutes * 60_000;
    return (endMs - this._now()) / 1000;
  }

  currentStepFor(taskId: string): StepInfo | null {
    const run = this._runs()[taskId];
    if (!run) return null;
    return this.findStep(run);
  }

  start(groupId: string, taskId: string, timerSetId: string): void {
    const found = this.tasksState.findTask(taskId);
    const set = found?.task.timerSets.find((s) => s.id === timerSetId);
    if (!set || set.timers.length === 0) return;
    this.stopSoundFor(taskId);
    this._runs.update((m) => ({
      ...m,
      [taskId]: {
        status: 'running',
        taskId,
        groupId,
        timerSetId,
        currentIndex: 0,
        stepStartedAt: new Date().toISOString(),
      },
    }));
  }

  advance(taskId: string): void {
    const run = this._runs()[taskId];
    if (!run || run.status !== 'awaitingAdvance') return;
    const set = this.findTimerSet(run);
    if (!set) {
      this.removeRun(taskId);
      return;
    }
    this.stopSoundFor(taskId);
    const nextIndex = run.completedIndex + 1;
    if (nextIndex >= set.timers.length) {
      this._runs.update((m) => ({
        ...m,
        [taskId]: {
          status: 'completed',
          taskId,
          groupId: run.groupId,
          timerSetId: run.timerSetId,
          finishedAt: new Date().toISOString(),
        },
      }));
      return;
    }
    this._runs.update((m) => ({
      ...m,
      [taskId]: {
        status: 'running',
        taskId,
        groupId: run.groupId,
        timerSetId: run.timerSetId,
        currentIndex: nextIndex,
        stepStartedAt: new Date().toISOString(),
      },
    }));
  }

  cancel(taskId: string): void {
    if (!this._runs()[taskId]) return;
    this.stopSoundFor(taskId);
    this.removeRun(taskId);
  }

  dismiss(taskId: string): void {
    if (!this._runs()[taskId]) return;
    this.stopSoundFor(taskId);
    this.removeRun(taskId);
  }

  focusNext(): void {
    const list = this.attentionRuns();
    if (list.length === 0) return;
    const id = this._focusedTaskId();
    const idx = id === null ? 0 : list.findIndex((r) => r.taskId === id);
    const safe = idx === -1 ? 0 : idx;
    const next = list[(safe + 1) % list.length];
    this._focusedTaskId.set(next.taskId);
  }

  focusPrev(): void {
    const list = this.attentionRuns();
    if (list.length === 0) return;
    const id = this._focusedTaskId();
    const idx = id === null ? 0 : list.findIndex((r) => r.taskId === id);
    const safe = idx === -1 ? 0 : idx;
    const prev = list[(safe - 1 + list.length) % list.length];
    this._focusedTaskId.set(prev.taskId);
  }

  private scheduleFire(taskId: string, run: RunningRun): void {
    const step = this.findStep(run);
    if (!step) return;
    const endMs = Date.parse(run.stepStartedAt) + step.step.durationMinutes * 60_000;
    const delay = Math.max(0, endMs - Date.now());
    const handle = setTimeout(() => this.handleStepEnd(taskId), delay);
    this.fireTimeouts.set(taskId, handle);
  }

  private handleStepEnd(taskId: string): void {
    const run = this._runs()[taskId];
    if (!run || run.status !== 'running') return;
    const set = this.findTimerSet(run);
    const step = set?.timers[run.currentIndex];
    if (!set || !step) {
      this.removeRun(taskId);
      return;
    }
    void this.playForRun(taskId, set.soundId);

    const isLast = run.currentIndex >= set.timers.length - 1;
    if (isLast) {
      this._runs.update((m) => ({
        ...m,
        [taskId]: {
          status: 'completed',
          taskId,
          groupId: run.groupId,
          timerSetId: run.timerSetId,
          finishedAt: new Date().toISOString(),
        },
      }));
      return;
    }
    if (set.autoAdvance) {
      this._runs.update((m) => ({
        ...m,
        [taskId]: {
          status: 'running',
          taskId,
          groupId: run.groupId,
          timerSetId: run.timerSetId,
          currentIndex: run.currentIndex + 1,
          stepStartedAt: new Date().toISOString(),
        },
      }));
      return;
    }
    this._runs.update((m) => ({
      ...m,
      [taskId]: {
        status: 'awaitingAdvance',
        taskId,
        groupId: run.groupId,
        timerSetId: run.timerSetId,
        completedIndex: run.currentIndex,
        finishedAt: new Date().toISOString(),
      },
    }));
  }

  private async playForRun(taskId: string, setSoundId: string | null): Promise<void> {
    const candidateIds = [setSoundId, this.soundsState.defaultSoundId()];
    for (const id of candidateIds) {
      if (!id) continue;
      const blob = await this.soundsState.getBlob(id);
      if (blob) {
        this.swapSoundHandle(taskId, playRunSound(blob, { loop: true }));
        return;
      }
    }
    this.swapSoundHandle(taskId, playRunBeep());
  }

  private swapSoundHandle(taskId: string, handle: RunSoundHandle): void {
    this.soundHandles.get(taskId)?.stop();
    this.soundHandles.set(taskId, handle);
  }

  private stopSoundFor(taskId: string): void {
    const handle = this.soundHandles.get(taskId);
    if (!handle) return;
    handle.stop();
    this.soundHandles.delete(taskId);
  }

  private removeRun(taskId: string): void {
    this._runs.update((m) => {
      if (!(taskId in m)) return m;
      const next = { ...m };
      delete next[taskId];
      return next;
    });
  }

  private findTimerSet(run: ActiveRun): TimerSet | null {
    const found = this.tasksState.findTask(run.taskId);
    return found?.task.timerSets.find((s) => s.id === run.timerSetId) ?? null;
  }

  private findStep(run: ActiveRun): StepInfo | null {
    const set = this.findTimerSet(run);
    if (!set) return null;
    const idx = run.status === 'running' ? run.currentIndex : 'completedIndex' in run ? run.completedIndex : -1;
    if (idx < 0) return null;
    const step = set.timers[idx];
    if (!step) return null;
    return { set, step, index: idx };
  }
}

const loadFromStorage = (): TimerRunsMap => {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (isEnvelope(parsed) && parsed.v === STORAGE_VERSION) {
        const map: TimerRunsMap = {};
        for (const taskId of Object.keys(parsed.runs)) {
          const entry = parsed.runs[taskId];
          if (isActiveRun(entry)) map[taskId] = entry;
        }
        return map;
      }
      localStorage.removeItem(STORAGE_KEY);
    }
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw !== null) {
      try {
        const legacy: unknown = JSON.parse(legacyRaw);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        if (isLegacyTimerRun(legacy) && legacy.status !== 'idle') {
          return { [(legacy as ActiveRun).taskId]: legacy as ActiveRun };
        }
      } catch {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    return {};
  } catch {
    return {};
  }
};

const saveToStorage = (runs: TimerRunsMap): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    if (Object.keys(runs).length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: STORAGE_VERSION, runs }));
  } catch {
    /* quota or unavailable */
  }
};

const isEnvelope = (value: unknown): value is { v: number; runs: Record<string, unknown> } => {
  if (!value || typeof value !== 'object') return false;
  const v = value as { v?: unknown; runs?: unknown };
  return typeof v.v === 'number' && !!v.runs && typeof v.runs === 'object';
};

/** Retained for explicit re-export so consumers can still import the legacy type. */
export type { LegacyTimerRun };
