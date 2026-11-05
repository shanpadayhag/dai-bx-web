'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import CheckInCard from '@/features/tracking/components/check-in-card';
import FinishTaskDialog from '@/features/tracking/components/finish-task-dialog';
import useTrackingEvents, {
  FINISH_DIALOG_ID,
  FINISH_END_CHOICE_FIELD,
  FINISH_END_FIELD_PREFIX,
  FINISH_MARK_DONE_FIELD,
} from '@/features/tracking/events/use-tracking-events';
import {
  TrackingContext,
  type TrackingContextValue,
} from '@/features/tracking/states/tracking-context';
import useTrackingStates from '@/features/tracking/states/use-tracking-states';

const CHECK_IN_TICK_MILLIS = 30_000;

type TrackingProviderProps = {
  children: ReactNode;
};

const TrackingProvider = ({ children }: TrackingProviderProps) => {
  const states = useTrackingStates();
  const events = useTrackingEvents(states);
  const {
    handleLoadTracking,
    handleTick,
    handleStartTask,
    handleStartCard,
    handleOpenFinish,
    handleApplyTimeTrackingSettings,
  } = events;
  const { runningItems, startingSourceIds, trackingRevision, lastFinishedItem } = states;

  useEffect(() => {
    void handleLoadTracking();
    const handleWindowFocus = () => void handleLoadTracking();
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [handleLoadTracking]);

  useEffect(() => {
    const tickTimer = window.setInterval(handleTick, CHECK_IN_TICK_MILLIS);
    return () => window.clearInterval(tickTimer);
  }, [handleTick]);

  const trackingValue = useMemo<TrackingContextValue>(
    () => ({
      runningItems,
      runningSourceIds: new Set([
        ...runningItems.map((runningItem) => runningItem.sourceId),
        ...startingSourceIds,
      ]),
      trackingRevision,
      lastFinishedItem,
      handleStartTask,
      handleStartCard,
      handleOpenFinish,
      handleApplyTimeTrackingSettings,
    }),
    [
      handleApplyTimeTrackingSettings,
      handleOpenFinish,
      handleStartCard,
      handleStartTask,
      lastFinishedItem,
      runningItems,
      startingSourceIds,
      trackingRevision,
    ],
  );

  const finishingItem =
    runningItems.find((runningItem) => runningItem.id === states.finishingItemId) ?? null;

  return (
    <TrackingContext.Provider value={trackingValue}>
      {children}
      <CheckInCard
        dueItems={events.dueItems}
        onAnswerYes={(eventId) => void events.handleAnswerYes(eventId)}
        onAnswerNo={events.handleAnswerNo}
      />
      <FinishTaskDialog
        formKey={`${states.finishingItemId ?? 'none'}-${states.finishOpenCount}`}
        dialogId={FINISH_DIALOG_ID}
        endChoiceField={FINISH_END_CHOICE_FIELD}
        endFieldPrefix={FINISH_END_FIELD_PREFIX}
        markDoneField={FINISH_MARK_DONE_FIELD}
        runningItem={finishingItem}
        now={states.now}
        finishAway={states.finishAway}
        isFinishing={states.isFinishing}
        onSubmit={(submitEvent) => void events.handleSubmitFinish(submitEvent)}
      />
    </TrackingContext.Provider>
  );
};

export default TrackingProvider;
