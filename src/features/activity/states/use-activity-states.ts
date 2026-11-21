import { useState } from 'react';
import type ActivityEntry from '@/features/activity/entities/activity-entry';

const useActivityStates = () => {
  const [activityEntries, setActivityEntries] = useState<readonly ActivityEntry[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);

  return {
    activityEntries,
    setActivityEntries,
    nextCursor,
    setNextCursor,
    isLoadingMore,
    setIsLoadingMore,
    hasLoadError,
    setHasLoadError,
  };
};

export default useActivityStates;
