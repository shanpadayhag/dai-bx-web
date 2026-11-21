import { useCallback, useEffect } from 'react';
import reportAppError from '@/core/report-app-error';
import findActivity from '@/features/activity/actions/find-activity';
import findCalendarEvents from '@/features/calendar/actions/find-calendar-events';
import { dayRange } from '@/features/calendar/entities/calendar-range';
import findCategories from '@/features/categories/actions/find-categories';
import findAccount from '@/features/settings/actions/find-account';
import setTaskDone from '@/features/tasks/actions/set-task-done';
import findUpNext from '@/features/today/actions/find-up-next';
import { dayStartIn, nextMidnightIn, todayDateIn } from '@/features/today/entities/today-day';
import type useTodayStates from '@/features/today/states/use-today-states';

const RUNNING_CLOCK_MILLIS = 1_000;
const IDLE_CLOCK_MILLIS = 30_000;
const CHANGE_SETTLE_MILLIS = 1_000;
const LONGEST_TIMER_MILLIS = 2_147_483_647;

type TodayEventsInputs = {
  calendarTimeZone: string;
  trackingRevision: number;
  hasRunningItems: boolean;
};

const waitUntil = (moment: Date): number =>
  Math.max(Math.min(moment.getTime() - Date.now() + CHANGE_SETTLE_MILLIS, LONGEST_TIMER_MILLIS), 0);

const useTodayEvents = (
  states: ReturnType<typeof useTodayStates>,
  { calendarTimeZone, trackingRevision, hasRunningItems }: TodayEventsInputs,
) => {
  const {
    upNext,
    now,
    setAccountName,
    setCategories,
    setEventRecords,
    setUpNext,
    setActivityEntries,
    setNow,
  } = states;
  const todayDate = todayDateIn(now, calendarTimeZone);

  const handleLoadUpNext = useCallback(async () => {
    try {
      setUpNext(await findUpNext());
    } catch (loadError) {
      reportAppError(loadError);
    }
  }, [setUpNext]);

  const handleLoadDay = useCallback(async () => {
    const loadEvents = async () => {
      try {
        const calendarRange = await findCalendarEvents(dayRange(todayDate, calendarTimeZone));
        setEventRecords(calendarRange.events);
      } catch (loadError) {
        reportAppError(loadError);
      }
    };
    const loadActivity = async () => {
      try {
        const activityPage = await findActivity({
          since: dayStartIn(todayDate, calendarTimeZone),
        });
        setActivityEntries(activityPage.entries);
      } catch (loadError) {
        reportAppError(loadError);
      }
    };
    await Promise.all([loadEvents(), handleLoadUpNext(), loadActivity()]);
  }, [calendarTimeZone, handleLoadUpNext, setActivityEntries, setEventRecords, todayDate]);

  const handleTickTask = useCallback(
    async (taskId: string) => {
      setUpNext((currentUpNext) =>
        currentUpNext === null
          ? null
          : {
              ...currentUpNext,
              tasks: currentUpNext.tasks.filter((upNextTask) => upNextTask.taskId !== taskId),
            },
      );
      try {
        await setTaskDone({ taskId, isDone: true });
      } catch (tickError) {
        reportAppError(tickError);
      }
      await handleLoadDay();
    },
    [handleLoadDay, setUpNext],
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [account, loadedCategories] = await Promise.all([findAccount(), findCategories()]);
        setAccountName(account.name);
        setCategories(loadedCategories);
      } catch (loadError) {
        reportAppError(loadError);
      }
    };
    void loadProfile();
  }, [setAccountName, setCategories]);

  useEffect(() => {
    void handleLoadDay();
  }, [handleLoadDay, trackingRevision]);

  useEffect(() => {
    const clockTimer = window.setInterval(
      () => setNow(new Date()),
      hasRunningItems ? RUNNING_CLOCK_MILLIS : IDLE_CLOCK_MILLIS,
    );
    return () => window.clearInterval(clockTimer);
  }, [hasRunningItems, setNow]);

  useEffect(() => {
    const midnightTimer = window.setTimeout(
      () => setNow(new Date()),
      waitUntil(nextMidnightIn(new Date(), calendarTimeZone)),
    );
    return () => window.clearTimeout(midnightTimer);
  }, [calendarTimeZone, setNow, todayDate]);

  const refreshAt = upNext?.refreshAt ?? null;
  useEffect(() => {
    if (refreshAt === null) return;
    const refreshTimer = window.setTimeout(() => void handleLoadUpNext(), waitUntil(refreshAt));
    return () => window.clearTimeout(refreshTimer);
  }, [handleLoadUpNext, refreshAt]);

  useEffect(() => {
    const refreshWhenShown = () => {
      if (document.visibilityState === 'visible') {
        setNow(new Date());
        void handleLoadDay();
      }
    };
    document.addEventListener('visibilitychange', refreshWhenShown);
    return () => document.removeEventListener('visibilitychange', refreshWhenShown);
  }, [handleLoadDay, setNow]);

  return { todayDate, handleTickTask: (taskId: string) => void handleTickTask(taskId) };
};

export default useTodayEvents;
