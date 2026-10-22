type CalendarEventKind = 'planned' | 'tracked' | 'running' | 'trimmed';

type CalendarEvent = {
  id: string;
  title: string;
  dayIndex: number;
  startMinute: number;
  durationMinutes: number;
  awayFromMinute: number | null;
  kind: CalendarEventKind;
  timeLabel: string;
};

export type { CalendarEventKind };
export default CalendarEvent;
