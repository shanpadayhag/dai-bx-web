import { useState } from 'react';
import type FinishedItemRecord from '@/features/tracking/entities/finished-item-record';
import type { FinishAway } from '@/features/tracking/entities/finish-end';
import type RunningItem from '@/features/tracking/entities/running-item';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';

const useTrackingStates = () => {
  const [runningItems, setRunningItems] = useState<readonly RunningItem[]>([]);
  const [startingSourceIds, setStartingSourceIds] = useState<ReadonlySet<string>>(new Set());
  const [timeTrackingSettings, setTimeTrackingSettings] = useState<TimeTrackingSettings | null>(
    null,
  );
  const [now, setNow] = useState(() => new Date());
  const [finishingItemId, setFinishingItemId] = useState<string | null>(null);
  const [finishAway, setFinishAway] = useState<FinishAway | null>(null);
  const [finishOpenCount, setFinishOpenCount] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [trackingRevision, setTrackingRevision] = useState(0);
  const [lastFinishedItem, setLastFinishedItem] = useState<FinishedItemRecord | null>(null);

  return {
    runningItems,
    setRunningItems,
    startingSourceIds,
    setStartingSourceIds,
    timeTrackingSettings,
    setTimeTrackingSettings,
    now,
    setNow,
    finishingItemId,
    setFinishingItemId,
    finishAway,
    setFinishAway,
    finishOpenCount,
    setFinishOpenCount,
    isFinishing,
    setIsFinishing,
    trackingRevision,
    setTrackingRevision,
    lastFinishedItem,
    setLastFinishedItem,
  };
};

export default useTrackingStates;
