import backendCardScheduleSource from '@/features/board/data_sources/backend/card-schedule-source';
import type CardSchedule from '@/features/board/entities/card-schedule';
import { scheduleRunFromRecord, type ScheduleRun } from '@/features/board/entities/card-schedule';

const SCHEDULE_RUNS_PAGE_SIZE = 20;

const findScheduleRuns = async (
  scheduleId: CardSchedule['id'],
  olderThan: Date | null,
): Promise<ScheduleRun[]> =>
  (
    await backendCardScheduleSource.listRuns(scheduleId, {
      ...(olderThan === null ? {} : { before: olderThan.toISOString() }),
      limit: SCHEDULE_RUNS_PAGE_SIZE,
    })
  ).map(scheduleRunFromRecord);

export { SCHEDULE_RUNS_PAGE_SIZE };
export default findScheduleRuns;
