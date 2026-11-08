import type { Category } from '@/core/category';
import type { RepeatRule } from '@/core/repeat-rule';

type CalendarEventKind = 'planned' | 'tracked';

type CalendarEventSource = { kind: 'task' | 'card' };

type CalendarEventSeries = {
  id: string;
  originalStart: Date;
  repeatRule: RepeatRule;
};

type CalendarEvent = {
  id: string;
  kind: CalendarEventKind;
  title: string;
  category: Category | null;
  startsAt: Date;
  endsAt: Date | null;
  finishedAt: Date | null;
  source: CalendarEventSource | null;
  series?: CalendarEventSeries;
  timeZone?: string;
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

export type { CalendarEventKind, CalendarEventSeries };
export { isEventRunning, trimmedEventMinutes };
export default CalendarEvent;
