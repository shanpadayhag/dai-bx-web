import backendCardScheduleSource from '@/features/board/data_sources/backend/card-schedule-source';
import type CardSchedule from '@/features/board/entities/card-schedule';
import { cardScheduleFromRecord } from '@/features/board/entities/card-schedule';

const runCardScheduleNow = async (scheduleId: CardSchedule['id']): Promise<CardSchedule> =>
  cardScheduleFromRecord(await backendCardScheduleSource.runNow(scheduleId));

export default runCardScheduleNow;
