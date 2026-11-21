import type { Category } from '@/core/category';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';

type AgendaRowKind = 'planned' | 'tracked' | 'running';

type AgendaLinkedTask = {
  id: string;
  isDone: boolean;
};

type AgendaRow = {
  id: string;
  title: string;
  kind: AgendaRowKind;
  category: Category | null;
  startsAt: Date;
  endsAt: Date | null;
  isPast: boolean;
  linkedTask: AgendaLinkedTask | null;
};

const agendaKindOf = (calendarEvent: CalendarEvent): AgendaRowKind => {
  if (calendarEvent.kind === 'planned') return 'planned';
  return calendarEvent.endsAt === null ? 'running' : 'tracked';
};

const agendaRowsFrom = (calendarEvents: readonly CalendarEvent[], now: Date): AgendaRow[] =>
  calendarEvents
    .map((calendarEvent) => ({
      id: calendarEvent.id,
      title: calendarEvent.title,
      kind: agendaKindOf(calendarEvent),
      category: calendarEvent.category,
      startsAt: calendarEvent.startsAt,
      endsAt: calendarEvent.endsAt,
      isPast: calendarEvent.endsAt !== null && calendarEvent.endsAt <= now,
      linkedTask:
        calendarEvent.linkedTask === undefined
          ? null
          : { id: calendarEvent.linkedTask.id, isDone: calendarEvent.linkedTask.isDone },
    }))
    .sort((leftRow, rightRow) => leftRow.startsAt.getTime() - rightRow.startsAt.getTime());

export type { AgendaRowKind };
export { agendaRowsFrom };
export default AgendaRow;
