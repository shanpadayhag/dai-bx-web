type TrackedSubjectRecord = 'task' | 'card';

type ActivityDetailsRecord =
  | { kind: 'started'; details: { subject: TrackedSubjectRecord; eventId: string } }
  | {
      kind: 'finished';
      details: {
        subject: TrackedSubjectRecord;
        eventId: string;
        trackedMinutes: number;
        markedDone: boolean;
        endedAtMillis?: number;
      };
    }
  | { kind: 'checked_in'; details: { subject: TrackedSubjectRecord; eventId: string } }
  | { kind: 'task_completed'; details: { isSubtask: boolean } }
  | { kind: 'task_reopened'; details: { isSubtask: boolean } }
  | {
      kind: 'card_moved';
      details: {
        fromListName: string | null;
        toListName: string | null;
        reason: string;
        taskTitle?: string;
      };
    }
  | {
      kind: 'schedule_ran';
      details: {
        how: string;
        moved: boolean;
        fromListName: string | null;
        toListName: string | null;
      };
    }
  | { kind: 'plan_accepted'; details: { blockCount: number } };

type ActivityEntryRecord = ActivityDetailsRecord & {
  id: string;
  occurredAt: string;
  title: string | null;
  contextName: string | null;
  taskId: string | null;
  cardId: string | null;
  boardId: string | null;
};

type ActivityPageRecord = {
  entries: ActivityEntryRecord[];
  nextCursor: string | null;
};

export type { ActivityDetailsRecord, ActivityPageRecord, TrackedSubjectRecord };
export default ActivityEntryRecord;
