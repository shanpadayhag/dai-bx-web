import { useCallback, useMemo, type FormEvent } from 'react';
import readFormText from '@/core/form-text';
import hidePopover, { showPopover } from '@/core/popover';
import reportAppError from '@/core/report-app-error';
import { readFormMoment } from '@/features/calendar/entities/form-moment';
import checkInRunningItem from '@/features/tracking/actions/check-in-running-item';
import findRunningItems from '@/features/tracking/actions/find-running-items';
import findTimeTrackingSettings from '@/features/tracking/actions/find-time-tracking-settings';
import finishRunningItem from '@/features/tracking/actions/finish-running-item';
import startTracking from '@/features/tracking/actions/start-tracking';
import { isCheckInDue } from '@/features/tracking/entities/check-in';
import { isEndChoice, type AwayReason } from '@/features/tracking/entities/finish-end';
import {
  checkInSinceMoment,
  type RunningItemSourceKind,
} from '@/features/tracking/entities/running-item';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';
import type useTrackingStates from '@/features/tracking/states/use-tracking-states';

export const FINISH_DIALOG_ID = 'finish-task-dialog';
export const RUNNING_LIST_ID = 'running-list';
export const FINISH_END_FIELD_PREFIX = 'finish-end';
export const FINISH_END_CHOICE_FIELD = 'end-choice';
export const FINISH_MARK_DONE_FIELD = 'mark-done';

const withoutId = (sourceIds: ReadonlySet<string>, sourceId: string): ReadonlySet<string> => {
  const remainingIds = new Set(sourceIds);
  remainingIds.delete(sourceId);
  return remainingIds;
};

const useTrackingEvents = (states: ReturnType<typeof useTrackingStates>) => {
  const {
    runningItems,
    timeTrackingSettings,
    now,
    finishingItemId,
    setRunningItems,
    setStartingSourceIds,
    setTimeTrackingSettings,
    setNow,
    setFinishingItemId,
    setFinishAway,
    setFinishOpenCount,
    setIsFinishing,
    setTrackingRevision,
    setLastFinishedItem,
  } = states;

  const dueItems = useMemo(
    () =>
      timeTrackingSettings === null
        ? []
        : runningItems.filter((runningItem) =>
            isCheckInDue(runningItem, timeTrackingSettings, now),
          ),
    [now, runningItems, timeTrackingSettings],
  );

  const handleLoadTracking = useCallback(async () => {
    try {
      const [loadedItems, loadedSettings] = await Promise.all([
        findRunningItems(),
        findTimeTrackingSettings(),
      ]);
      setRunningItems(loadedItems);
      setTimeTrackingSettings(loadedSettings);
      setNow(new Date());
    } catch (loadError) {
      reportAppError(loadError);
    }
  }, [setNow, setRunningItems, setTimeTrackingSettings]);

  const handleTick = useCallback(() => setNow(new Date()), [setNow]);

  const startSource = useCallback(
    async (sourceKind: RunningItemSourceKind, sourceId: string) => {
      setStartingSourceIds((currentIds) => new Set(currentIds).add(sourceId));
      try {
        const startedItem = await startTracking({ sourceKind, sourceId });
        setRunningItems((currentItems) => [
          startedItem,
          ...currentItems.filter((runningItem) => runningItem.id !== startedItem.id),
        ]);
        setTrackingRevision((currentRevision) => currentRevision + 1);
      } catch (startError) {
        reportAppError(startError);
      } finally {
        setStartingSourceIds((currentIds) => withoutId(currentIds, sourceId));
      }
    },
    [setRunningItems, setStartingSourceIds, setTrackingRevision],
  );

  const handleStartTask = useCallback(
    (taskId: string) => void startSource('task', taskId),
    [startSource],
  );

  const handleStartCard = useCallback(
    (cardId: string) => void startSource('card', cardId),
    [startSource],
  );

  const openFinish = useCallback(
    (eventId: string, awayReason: AwayReason | null) => {
      const finishingItem = runningItems.find((runningItem) => runningItem.id === eventId);
      if (finishingItem === undefined) return;
      const isAway =
        awayReason !== null ||
        (timeTrackingSettings !== null &&
          isCheckInDue(finishingItem, timeTrackingSettings, new Date()));
      setFinishingItemId(eventId);
      setFinishAway(
        isAway
          ? { reason: awayReason ?? 'unanswered', since: checkInSinceMoment(finishingItem) }
          : null,
      );
      setFinishOpenCount((currentCount) => currentCount + 1);
      setNow(new Date());
      hidePopover(RUNNING_LIST_ID);
      showPopover(FINISH_DIALOG_ID);
    },
    [
      runningItems,
      setFinishAway,
      setFinishOpenCount,
      setFinishingItemId,
      setNow,
      timeTrackingSettings,
    ],
  );

  const handleApplyTimeTrackingSettings = useCallback(
    (savedSettings: TimeTrackingSettings) => {
      setTimeTrackingSettings(savedSettings);
      setNow(new Date());
    },
    [setNow, setTimeTrackingSettings],
  );

  const handleOpenFinish = useCallback(
    (eventId: string) => openFinish(eventId, null),
    [openFinish],
  );

  const handleAnswerNo = useCallback(
    (eventId: string) => openFinish(eventId, 'answered-no'),
    [openFinish],
  );

  const handleAnswerYes = useCallback(
    async (eventId: string) => {
      const answeredItem = runningItems.find((runningItem) => runningItem.id === eventId);
      if (answeredItem === undefined) return;
      const answeredAt = new Date();
      setRunningItems((currentItems) =>
        currentItems.map((runningItem) =>
          runningItem.id === eventId ? { ...runningItem, lastAnsweredAt: answeredAt } : runningItem,
        ),
      );
      try {
        const checkedInItem = await checkInRunningItem(eventId);
        setRunningItems((currentItems) =>
          currentItems.map((runningItem) =>
            runningItem.id === eventId ? checkedInItem : runningItem,
          ),
        );
      } catch (checkInError) {
        setRunningItems((currentItems) =>
          currentItems.map((runningItem) =>
            runningItem.id === eventId
              ? { ...runningItem, lastAnsweredAt: answeredItem.lastAnsweredAt }
              : runningItem,
          ),
        );
        reportAppError(checkInError);
      }
    },
    [runningItems, setRunningItems],
  );

  const handleSubmitFinish = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const finishingItem = runningItems.find((runningItem) => runningItem.id === finishingItemId);
      if (finishingItem === undefined) return;
      const finishForm = new FormData(submitEvent.currentTarget);
      const endChoiceText = readFormText(finishForm, FINISH_END_CHOICE_FIELD);
      setIsFinishing(true);
      try {
        const finishedItem = await finishRunningItem({
          runningItem: finishingItem,
          endChoice: isEndChoice(endChoiceText) ? endChoiceText : 'now',
          customEndsAt: readFormMoment(finishForm, FINISH_END_FIELD_PREFIX),
          markDone: finishForm.has(FINISH_MARK_DONE_FIELD),
          now: new Date(),
        });
        setRunningItems((currentItems) =>
          currentItems.filter((runningItem) => runningItem.id !== finishingItem.id),
        );
        setLastFinishedItem(finishedItem);
        setTrackingRevision((currentRevision) => currentRevision + 1);
        hidePopover(FINISH_DIALOG_ID);
        setFinishingItemId(null);
      } catch (finishError) {
        reportAppError(finishError);
      } finally {
        setIsFinishing(false);
      }
    },
    [
      finishingItemId,
      runningItems,
      setFinishingItemId,
      setIsFinishing,
      setLastFinishedItem,
      setRunningItems,
      setTrackingRevision,
    ],
  );

  return {
    dueItems,
    handleLoadTracking,
    handleTick,
    handleStartTask,
    handleStartCard,
    handleOpenFinish,
    handleApplyTimeTrackingSettings,
    handleAnswerYes,
    handleAnswerNo,
    handleSubmitFinish,
  };
};

export default useTrackingEvents;
