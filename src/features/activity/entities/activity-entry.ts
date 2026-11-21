import { formatClockInZone } from '@/core/time-zone';
import { addCalendarDays, calendarDateTitle, partsInZone } from '@/core/zoned-time';
import type ActivityEntryRecord from '@/features/activity/entities/activity-entry-record';
import type { ActivityDetailsRecord } from '@/features/activity/entities/activity-entry-record';
import { formatEstimate } from '@/features/tasks/entities/estimate';

type ActivityEntry = ActivityDetailsRecord & {
  id: string;
  occurredAt: Date;
  title: string | null;
  contextName: string | null;
  taskId: string | null;
  cardId: string | null;
  boardId: string | null;
};

type ActivityDescription = {
  action: string;
  title: string | null;
  detail: string;
};

type ActivityDay = {
  calendarDate: string;
  dayLabel: string;
  entries: ActivityEntry[];
};

const PLAN_TITLE = 'a plan';

const cardMoveReasonLabels: Record<string, string> = {
  by_hand: 'by hand',
  started: 'task started',
  finished: 'task finished',
  archived_idle: 'archived (idle)',
  archived_by_hand: 'archived',
  restored: 'restored',
};

const scheduleRunLabels: Record<string, string> = {
  on_time: 'on time',
  late: 'late',
  by_hand: 'by hand',
};

const activityEntryFromRecord = (entryRecord: ActivityEntryRecord): ActivityEntry =>
  ({ ...entryRecord, occurredAt: new Date(entryRecord.occurredAt) }) as ActivityEntry;

const joinDetail = (detailParts: readonly (string | null | undefined | false)[]): string =>
  detailParts.filter((detailPart): detailPart is string => Boolean(detailPart)).join(' · ');

const listMove = (fromListName: string | null, toListName: string | null): string | null => {
  if (fromListName !== null && toListName !== null) return `${fromListName} → ${toListName}`;
  return fromListName ?? toListName;
};

const cardMoveReason = (reason: string, taskTitle: string | undefined): string => {
  const reasonLabel = cardMoveReasonLabels[reason] ?? reason.replaceAll('_', ' ');
  return reason === 'started' && taskTitle !== undefined
    ? `${reasonLabel}: ${taskTitle}`
    : reasonLabel;
};

const formatTrackedMinutes = (trackedMinutes: number): string =>
  trackedMinutes === 0 ? 'under a minute tracked' : `${formatEstimate(trackedMinutes)} tracked`;

const describeActivity = (activityEntry: ActivityEntry, timeZone: string): ActivityDescription => {
  const { contextName, title } = activityEntry;
  switch (activityEntry.kind) {
    case 'started':
      return { action: 'Started', title, detail: joinDetail([contextName]) };
    case 'finished': {
      const { details } = activityEntry;
      return {
        action: 'Finished',
        title,
        detail: joinDetail([
          formatTrackedMinutes(details.trackedMinutes),
          details.markedDone && 'marked done',
          details.endedAtMillis !== undefined &&
            `ended ${formatClockInZone(new Date(details.endedAtMillis), timeZone)}`,
        ]),
      };
    }
    case 'checked_in':
      return { action: 'Checked in on', title, detail: joinDetail([contextName]) };
    case 'task_completed':
      return {
        action: 'Ticked',
        title,
        detail: joinDetail([contextName, activityEntry.details.isSubtask && 'subtask']),
      };
    case 'task_reopened':
      return {
        action: 'Reopened',
        title,
        detail: joinDetail([contextName, activityEntry.details.isSubtask && 'subtask']),
      };
    case 'card_moved': {
      const { details } = activityEntry;
      return {
        action: 'Moved',
        title,
        detail: joinDetail([
          listMove(details.fromListName, details.toListName),
          cardMoveReason(details.reason, details.taskTitle),
        ]),
      };
    }
    case 'schedule_ran': {
      const { details } = activityEntry;
      const listChange = listMove(details.fromListName, details.toListName);
      return {
        action: 'Schedule ran on',
        title,
        detail: joinDetail([
          scheduleRunLabels[details.how] ?? details.how.replaceAll('_', ' '),
          details.moved ? (listChange === null ? 'moved' : `moved ${listChange}`) : "didn't move",
        ]),
      };
    }
    case 'plan_accepted': {
      const { blockCount } = activityEntry.details;
      return {
        action: 'Accepted',
        title: PLAN_TITLE,
        detail: `${blockCount} ${blockCount === 1 ? 'block' : 'blocks'}`,
      };
    }
  }
};

const activityLink = (activityEntry: ActivityEntry): string | null => {
  if (activityEntry.cardId !== null && activityEntry.boardId !== null) {
    return `/board?board=${activityEntry.boardId}&card=${activityEntry.cardId}`;
  }
  return null;
};

const dayLabelOf = (calendarDate: string, todayDate: string): string => {
  if (calendarDate === todayDate) return 'Today';
  if (calendarDate === addCalendarDays(todayDate, -1)) return 'Yesterday';
  return calendarDateTitle(
    calendarDate,
    { weekday: 'long', month: 'long', day: 'numeric' },
    'en-US',
  );
};

const groupActivityByDay = (
  activityEntries: readonly ActivityEntry[],
  timeZone: string,
  now: Date,
): ActivityDay[] => {
  const todayDate = partsInZone(now, timeZone).calendarDate;
  const activityDays: ActivityDay[] = [];
  for (const activityEntry of activityEntries) {
    const calendarDate = partsInZone(activityEntry.occurredAt, timeZone).calendarDate;
    const latestDay = activityDays.at(-1);
    if (latestDay !== undefined && latestDay.calendarDate === calendarDate) {
      latestDay.entries.push(activityEntry);
    } else {
      activityDays.push({
        calendarDate,
        dayLabel: dayLabelOf(calendarDate, todayDate),
        entries: [activityEntry],
      });
    }
  }
  return activityDays;
};

export type { ActivityDay, ActivityDescription };
export { activityEntryFromRecord, activityLink, describeActivity, groupActivityByDay };
export default ActivityEntry;
