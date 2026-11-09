import backendCardScheduleSource from '@/features/board/data_sources/backend/card-schedule-source';
import type CardSchedule from '@/features/board/entities/card-schedule';
import { cardScheduleFromRecord } from '@/features/board/entities/card-schedule';

const deleteCardSchedule = async (scheduleId: CardSchedule['id']): Promise<CardSchedule[]> =>
  (await backendCardScheduleSource.delete(scheduleId)).schedules.map(cardScheduleFromRecord);

export default deleteCardSchedule;
