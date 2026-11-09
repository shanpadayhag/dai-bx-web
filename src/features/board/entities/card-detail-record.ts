import type { BoardCardRecord } from '@/features/board/entities/board-record';
import type CardScheduleRecord from '@/features/board/entities/card-schedule-record';
import type LinkedTask from '@/features/board/entities/linked-task';

type CardDetailRecord = {
  card: BoardCardRecord;
  notes: string;
  linkedTasks: LinkedTask[];
  trackedEventCount: number;
  schedules: CardScheduleRecord[];
};

export default CardDetailRecord;
