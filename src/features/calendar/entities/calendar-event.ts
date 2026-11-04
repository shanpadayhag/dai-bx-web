import type { Category } from '@/core/category';

type CalendarEventKind = 'planned' | 'tracked';

type CalendarEventSource = { kind: 'task' | 'card' };

type CalendarEvent = {
  id: string;
  kind: CalendarEventKind;
  title: string;
  category: Category | null;
  startsAt: Date;
  endsAt: Date | null;
  finishedAt: Date | null;
  source: CalendarEventSource | null;
};

const isEventRunning = (calendarEvent: CalendarEvent): boolean =>
  calendarEvent.kind === 'tracked' && calendarEvent.endsAt === null;

const trimmedEventMinutes = (calendarEvent: CalendarEvent): number =>
  calendarEvent.endsAt === null || calendarEvent.finishedAt === null
    ? 0
    : Math.max(
        0,
        Math.round((calendarEvent.finishedAt.getTime() - calendarEvent.endsAt.getTime()) / 60_000),
      );

export type { CalendarEventKind };
export { isEventRunning, trimmedEventMinutes };
export default CalendarEvent;
