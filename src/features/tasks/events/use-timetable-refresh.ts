import { useEffect } from 'react';
import {
  nextTimetableChangeAt,
  type GroupSchedule,
} from '@/features/tasks/entities/group-schedule';

const CHANGE_SETTLE_MILLIS = 1_000;
const LONGEST_TIMER_MILLIS = 2_147_483_647;

const useTimetableRefresh = (
  groupSchedules: readonly GroupSchedule[] | null,
  now: Date,
  onRefresh: () => Promise<void>,
) => {
  useEffect(() => {
    if (groupSchedules === null) return;
    const nextChangeAt = nextTimetableChangeAt(groupSchedules, now);
    if (nextChangeAt === null) return;
    const waitMillis = Math.min(
      nextChangeAt.getTime() - Date.now() + CHANGE_SETTLE_MILLIS,
      LONGEST_TIMER_MILLIS,
    );
    const refreshTimerId = window.setTimeout(() => void onRefresh(), Math.max(waitMillis, 0));
    return () => window.clearTimeout(refreshTimerId);
  }, [groupSchedules, now, onRefresh]);

  useEffect(() => {
    const refreshWhenShown = () => {
      if (document.visibilityState === 'visible') void onRefresh();
    };
    document.addEventListener('visibilitychange', refreshWhenShown);
    return () => document.removeEventListener('visibilitychange', refreshWhenShown);
  }, [onRefresh]);
};

export default useTimetableRefresh;
