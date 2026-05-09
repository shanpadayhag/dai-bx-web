import type { AlarmSpec } from '@features/alarms/data-access/alarms.types';
import type { TimerSet } from '@features/timers/data-access/timers.types';

export interface Task {
  id: string;
  name: string;
  order: number;
  hiddenUntil: string | null;
  completedDate: string | null;
  isOpen: boolean;
  alarm: AlarmSpec | null;
  timerSets: TimerSet[];
  activeTimerSetId: string | null;
  tasks: Task[];
}

export interface TaskRow {
  id: string;
  groupId: string;
  parentId: string | null;
  name: string;
  order: number;
  hiddenUntil: string | null;
  completedDate: string | null;
  isOpen: boolean;
  alarm: AlarmSpec | null;
  timerSets: TimerSet[];
  activeTimerSetId: string | null;
}
