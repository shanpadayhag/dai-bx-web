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

export type TimerRun =
  | { status: 'idle' }
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
