'use client';

import { useEffect, useState } from 'react';
import RunningList from '@/features/tracking/components/running-list';
import RunningPill from '@/features/tracking/components/running-pill';
import { RUNNING_LIST_ID } from '@/features/tracking/events/use-tracking-events';
import { useTracking } from '@/features/tracking/states/tracking-context';

const ELAPSED_TICK_MILLIS = 1_000;

const TrackingPill = () => {
  const { runningItems, handleOpenFinish } = useTracking();
  const [now, setNow] = useState(() => new Date());
  const isRunning = runningItems.length > 0;

  useEffect(() => {
    if (!isRunning) return;
    const elapsedTimer = window.setInterval(() => setNow(new Date()), ELAPSED_TICK_MILLIS);
    return () => window.clearInterval(elapsedTimer);
  }, [isRunning]);

  return (
    <>
      <RunningPill
        runningListId={RUNNING_LIST_ID}
        runningItems={runningItems}
        now={now}
        onFinish={handleOpenFinish}
      />
      <RunningList
        runningListId={RUNNING_LIST_ID}
        runningItems={runningItems}
        now={now}
        onFinish={handleOpenFinish}
      />
    </>
  );
};

export default TrackingPill;
