import backendCardScheduleSource from '@/features/board/data_sources/backend/card-schedule-source';
import type CardSchedule from '@/features/board/entities/card-schedule';
import { cardScheduleFromRecord } from '@/features/board/entities/card-schedule';

const setCardSchedulePaused = async (
  scheduleId: CardSchedule['id'],
  isPaused: boolean,
): Promise<CardSchedule> =>
  cardScheduleFromRecord(
    await (isPaused
      ? backendCardScheduleSource.pause(scheduleId)
      : backendCardScheduleSource.resume(scheduleId)),
  );

export default setCardSchedulePaused;
