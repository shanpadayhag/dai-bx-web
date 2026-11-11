import type { BoardCardRecord } from '@/features/board/entities/board-record';
import type { CardArchiveRecord } from '@/features/board/entities/card-archive';
import type CardScheduleRecord from '@/features/board/entities/card-schedule-record';
import type CardTriggers from '@/features/board/entities/card-triggers';
import type LinkedTask from '@/features/board/entities/linked-task';

type DetailCardRecord = Omit<BoardCardRecord, 'listId' | 'position'> & {
  listId: BoardCardRecord['listId'] | null;
  position: BoardCardRecord['position'] | null;
};

type CardDetailRecord = {
  card: DetailCardRecord;
  notes: string;
  linkedTasks: LinkedTask[];
  trackedEventCount: number;
  schedules: CardScheduleRecord[];
  triggers: CardTriggers;
  archived: CardArchiveRecord | null;
};

export type { DetailCardRecord };
export default CardDetailRecord;
