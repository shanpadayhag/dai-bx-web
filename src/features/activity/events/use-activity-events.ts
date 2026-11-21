import { useCallback } from 'react';
import reportAppError from '@/core/report-app-error';
import findActivity from '@/features/activity/actions/find-activity';
import type useActivityStates from '@/features/activity/states/use-activity-states';

const ACTIVITY_PAGE_SIZE = 50;

const useActivityEvents = (states: ReturnType<typeof useActivityStates>) => {
  const { nextCursor, setActivityEntries, setNextCursor, setIsLoadingMore, setHasLoadError } =
    states;

  const handleLoadFirstPage = useCallback(async () => {
    try {
      const activityPage = await findActivity({ limit: ACTIVITY_PAGE_SIZE });
      setActivityEntries(activityPage.entries);
      setNextCursor(activityPage.nextCursor);
      setHasLoadError(false);
    } catch (loadError) {
      setHasLoadError(true);
      reportAppError(loadError);
    }
  }, [setActivityEntries, setHasLoadError, setNextCursor]);

  const handleLoadMore = useCallback(async () => {
    if (nextCursor === null) return;
    setIsLoadingMore(true);
    try {
      const activityPage = await findActivity({ cursor: nextCursor, limit: ACTIVITY_PAGE_SIZE });
      setActivityEntries((currentEntries) => [...(currentEntries ?? []), ...activityPage.entries]);
      setNextCursor(activityPage.nextCursor);
    } catch (loadError) {
      reportAppError(loadError);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, setActivityEntries, setIsLoadingMore, setNextCursor]);

  return { handleLoadFirstPage, handleLoadMore };
};

export default useActivityEvents;
