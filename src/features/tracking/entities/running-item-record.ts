import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import type { TrackedSourceRecord } from '@/features/calendar/entities/calendar-event-record';

type RunningItemRecord = Omit<CalendarEventRecord, 'source'> & {
  source: TrackedSourceRecord;
  estimateMinutes: number | null;
  sourceName: string;
};

export default RunningItemRecord;
