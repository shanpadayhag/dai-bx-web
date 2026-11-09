import type { ScheduleRun } from '@/features/board/entities/card-schedule';

type ScheduleRunsPage = {
  runs: readonly ScheduleRun[];
  hasOlderRuns: boolean;
  isLoading: boolean;
};

export default ScheduleRunsPage;
