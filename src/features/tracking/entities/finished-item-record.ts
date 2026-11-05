import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import type { GroupTasks } from '@/features/tasks/entities/group-tasks';

type FinishedItemRecord = {
  event: CalendarEventRecord;
  groupTasks?: GroupTasks;
};

export default FinishedItemRecord;
