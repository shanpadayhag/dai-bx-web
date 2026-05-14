export interface TimerSpec {
  id: string;
  durationMinutes: number;
  order: number;
}

export interface TimerSet {
  id: string;
  name: string;
  order: number;
  autoAdvance: boolean;
  soundId: string | null;
  timers: TimerSpec[];
}

export type ActiveRun =
  | {
      status: 'running';
      taskId: string;
      groupId: string;
      timerSetId: string;
      currentIndex: number;
      stepStartedAt: string;
    }
  | {
      status: 'awaitingAdvance';
      taskId: string;
      groupId: string;
      timerSetId: string;
      completedIndex: number;
      finishedAt: string;
    }
  | {
      status: 'completed';
      taskId: string;
      groupId: string;
      timerSetId: string;
      finishedAt: string;
    };

export type TimerRunsMap = Record<string, ActiveRun>;

/** Legacy single-run union — retained only for migration parsing. */
export type LegacyTimerRun = ActiveRun | { status: 'idle' };

export const isActiveRun = (value: unknown): value is ActiveRun => {
  if (!value || typeof value !== 'object') return false;
  const v = value as {
    status?: unknown;
    taskId?: unknown;
    groupId?: unknown;
    timerSetId?: unknown;
  };
  if (typeof v.taskId !== 'string') return false;
  if (typeof v.groupId !== 'string') return false;
  if (typeof v.timerSetId !== 'string') return false;
  if (v.status === 'running') {
    const r = value as { currentIndex?: unknown; stepStartedAt?: unknown };
    return typeof r.currentIndex === 'number' && typeof r.stepStartedAt === 'string';
  }
  if (v.status === 'awaitingAdvance') {
    const r = value as { completedIndex?: unknown; finishedAt?: unknown };
    return typeof r.completedIndex === 'number' && typeof r.finishedAt === 'string';
  }
  if (v.status === 'completed') {
    const r = value as { finishedAt?: unknown };
    return typeof r.finishedAt === 'string';
  }
  return false;
};

export const isLegacyTimerRun = (value: unknown): value is LegacyTimerRun => {
  if (!value || typeof value !== 'object') return false;
  const status = (value as { status?: unknown }).status;
  if (status === 'idle') return true;
  return isActiveRun(value);
};
