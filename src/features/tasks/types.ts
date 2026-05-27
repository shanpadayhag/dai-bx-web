/**
 * Task entity — ported 1:1 from client-web-old/.../tasks/data-access/tasks.types.ts.
 *
 * Two shapes:
 *   - `Task`     — the in-memory tree node with nested `tasks: Task[]`.
 *   - `TaskRow`  — the IDB row shape, flat: `groupId` + `parentId` instead of nesting.
 *
 * Conversion happens in the tasks store (tree → rows on persist, rows → tree on load).
 */

import type { AlarmSpec } from '~/features/alarms/types'
import type { TimerSet } from '~/features/timers/types'

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
