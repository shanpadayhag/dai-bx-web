import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, type FormEvent } from 'react';
import AppError from '@/core/app-error';
import readFormText, { readFormCategoryId, readFormRepeatRule } from '@/core/form-text';
import type {
  OccurrenceScope,
  OccurrenceScopeAnswer,
  OccurrenceScopeRequest,
} from '@/core/occurrence-scope';
import hidePopover, { showPopover } from '@/core/popover';
import type { RepeatRule } from '@/core/repeat-rule';
import reportAppError from '@/core/report-app-error';
import { deviceTimeZone } from '@/core/time-zone';
import { instantInZone, partsInZone } from '@/core/zoned-time';
import changeEventCategory from '@/features/calendar/actions/change-event-category';
import changeEventOccurrence from '@/features/calendar/actions/change-event-occurrence';
import changeTrackedTimes from '@/features/calendar/actions/change-tracked-times';
import createPlannedEvent from '@/features/calendar/actions/create-planned-event';
import deleteCalendarEvent from '@/features/calendar/actions/delete-calendar-event';
import deleteEventOccurrence from '@/features/calendar/actions/delete-event-occurrence';
import findCalendarEvents from '@/features/calendar/actions/find-calendar-events';
import updatePlannedEvent from '@/features/calendar/actions/update-planned-event';
import localStorageCalendarViewSource from '@/features/calendar/data_sources/local_storage/calendar-view-source';
import {
  calendarPath,
  readCalendarAddress,
  shiftAnchorDate,
  type CalendarView,
} from '@/features/calendar/entities/calendar-address';
import { shownRangeOf } from '@/features/calendar/entities/calendar-days';
import type { EventTimes } from '@/features/calendar/entities/calendar-drag';
import type {
  CalendarEventChanges,
  LocalEventChange,
} from '@/features/calendar/entities/calendar-event-changes';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import {
  scheduledMoveFromRecord,
  seriesOccurrenceKeyOf,
  type CalendarRangeRecord,
} from '@/features/calendar/entities/calendar-event-record';
import type CalendarRange from '@/features/calendar/entities/calendar-range';
import { readFormMoment } from '@/features/calendar/entities/form-moment';
import {
  confirmEventWrite,
  confirmEventWriteWithRecords,
  failEventWrite,
  startEventWrite,
  startOptimisticCalendar,
  takeConfirmedChange,
  visibleEventRecords,
} from '@/features/calendar/entities/optimistic-calendar';
import type useCalendarStates from '@/features/calendar/states/use-calendar-states';
import findCategories from '@/features/categories/actions/find-categories';
import findTimeTrackingSettings from '@/features/tracking/actions/find-time-tracking-settings';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';

export const NEW_EVENT_DIALOG_ID = 'new-event-dialog';
export const NEW_EVENT_FIELD_PREFIX = 'new-event';
export const PLANNED_EVENT_FIELD_PREFIX = 'planned-event';
export const TRACKED_EVENT_FIELD_PREFIX = 'tracked-event';
export const OCCURRENCE_SCOPE_DIALOG_ID = 'occurrence-scope-dialog';

const HOUR_MINUTES = 60;

type PlannedFormChanges = {
  title: string;
  categoryId: string | null;
  startsAt: Date;
  endsAt: Date;
  timeZone?: string;
  repeat?: RepeatRule | null;
};

const calendarZoneOf = (timeTrackingSettings: TimeTrackingSettings | null): string =>
  timeTrackingSettings?.calendarTimeZone ?? deviceTimeZone();

const replaceWith = (answeredRecord: CalendarEventRecord): LocalEventChange => ({
  kind: 'replace',
  eventRecord: answeredRecord,
});

const nextHourTimes = (now: Date, timeZone: string): EventTimes => {
  const nowParts = partsInZone(now, timeZone);
  const nextHourMinute = (nowParts.hour + 1) * HOUR_MINUTES;
  return {
    startsAt: instantInZone(nowParts.calendarDate, nextHourMinute, timeZone),
    endsAt: instantInZone(nowParts.calendarDate, nextHourMinute + HOUR_MINUTES, timeZone),
  };
};

const isSameRule = (firstRule: RepeatRule | null, secondRule: RepeatRule | null): boolean =>
  JSON.stringify(firstRule) === JSON.stringify(secondRule);

const recordTimeChanges = (eventTimes: { startsAt: Date; endsAt: Date }): CalendarEventChanges =>
  Number.isNaN(eventTimes.startsAt.getTime()) || Number.isNaN(eventTimes.endsAt.getTime())
    ? {}
    : { startsAt: eventTimes.startsAt.toISOString(), endsAt: eventTimes.endsAt.toISOString() };

const useCalendarEvents = (states: ReturnType<typeof useCalendarStates>) => {
  const {
    calendarView,
    anchorDate,
    optimisticCalendar,
    timeTrackingSettings,
    now,
    setNow,
    setCalendarView,
    setAnchorDate,
    setCategories,
    setTimeTrackingSettings,
    setOptimisticCalendar,
    setScheduledMoves,
    setPageLoadError,
    setSelectedEventId,
    setNewEventDraft,
    setIsSavingNewEvent,
    setOccurrenceScopeRequest,
  } = states;
  const router = useRouter();
  const lastWriteIdRef = useRef(0);
  const lastRangeLoadIdRef = useRef(0);
  const shownRangeRef = useRef<CalendarRange | null>(null);
  const scopedWriteRef = useRef<((occurrenceScope: OccurrenceScope) => void) | null>(null);

  const calendarTimeZone = useMemo(
    () => calendarZoneOf(timeTrackingSettings),
    [timeTrackingSettings],
  );

  const shownEventRecords = useMemo(
    () => (optimisticCalendar === null ? [] : visibleEventRecords(optimisticCalendar)),
    [optimisticCalendar],
  );

  const showRangeRecord = useCallback(
    (shownRange: CalendarRange, rangeRecord: CalendarRangeRecord) => {
      shownRangeRef.current = shownRange;
      setOptimisticCalendar(startOptimisticCalendar(shownRange, rangeRecord.events));
      setScheduledMoves(rangeRecord.moves.map(scheduledMoveFromRecord));
    },
    [setOptimisticCalendar, setScheduledMoves],
  );

  const loadRange = useCallback(
    async (shownView: CalendarView, shownAnchorDate: string) => {
      lastRangeLoadIdRef.current += 1;
      const rangeLoadId = lastRangeLoadIdRef.current;
      const shownRange = shownRangeOf(shownView, shownAnchorDate, calendarTimeZone);
      try {
        const rangeRecord = await findCalendarEvents(shownRange);
        if (rangeLoadId !== lastRangeLoadIdRef.current) return;
        showRangeRecord(shownRange, rangeRecord);
      } catch (rangeError) {
        reportAppError(rangeError);
      }
    },
    [calendarTimeZone, showRangeRecord],
  );

  const showRange = useCallback(
    async (shownView: CalendarView, shownAnchorDate: string) => {
      setCalendarView(shownView);
      setAnchorDate(shownAnchorDate);
      router.replace(calendarPath(shownView, shownAnchorDate), { scroll: false });
      await loadRange(shownView, shownAnchorDate);
    },
    [loadRange, router, setAnchorDate, setCalendarView],
  );

  const handleReloadRange = useCallback(() => {
    if (anchorDate !== null) void loadRange(calendarView, anchorDate);
  }, [anchorDate, calendarView, loadRange]);

  const handleLoadPage = useCallback(async () => {
    setPageLoadError(null);
    lastRangeLoadIdRef.current += 1;
    const loadRangeInZone = async (loadedSettings: TimeTrackingSettings) => {
      const loadedZone = calendarZoneOf(loadedSettings);
      const calendarAddress = readCalendarAddress(
        window.location.search,
        localStorageCalendarViewSource.findView(),
        partsInZone(new Date(), loadedZone).calendarDate,
      );
      const shownRange = shownRangeOf(calendarAddress.view, calendarAddress.anchorDate, loadedZone);
      return {
        loadedSettings,
        calendarAddress,
        shownRange,
        rangeRecord: await findCalendarEvents(shownRange),
      };
    };
    try {
      const [loadedCategories, loadedRange] = await Promise.all([
        findCategories(),
        findTimeTrackingSettings().then(loadRangeInZone),
      ]);
      setCategories(loadedCategories);
      setTimeTrackingSettings(loadedRange.loadedSettings);
      setCalendarView(loadedRange.calendarAddress.view);
      setAnchorDate(loadedRange.calendarAddress.anchorDate);
      showRangeRecord(loadedRange.shownRange, loadedRange.rangeRecord);
    } catch (pageError) {
      if (!(pageError instanceof AppError)) throw pageError;
      setPageLoadError(pageError);
    }
  }, [
    setAnchorDate,
    setCalendarView,
    setCategories,
    setPageLoadError,
    setTimeTrackingSettings,
    showRangeRecord,
  ]);

  const handleSelectView = useCallback(
    (chosenView: CalendarView) => {
      if (anchorDate === null || chosenView === calendarView) return;
      localStorageCalendarViewSource.saveView(chosenView);
      void showRange(chosenView, anchorDate);
    },
    [anchorDate, calendarView, showRange],
  );

  const handleStepRange = useCallback(
    (stepCount: number) => {
      if (anchorDate === null) return;
      void showRange(calendarView, shiftAnchorDate(calendarView, anchorDate, stepCount));
    },
    [anchorDate, calendarView, showRange],
  );

  const handleShowToday = useCallback(() => {
    void showRange(calendarView, partsInZone(new Date(), calendarTimeZone).calendarDate);
  }, [calendarTimeZone, calendarView, showRange]);

  const handleSelectEvent = useCallback(
    (eventId: string | null) => setSelectedEventId(eventId),
    [setSelectedEventId],
  );

  const runEventWrite = useCallback(
    async (
      localChange: LocalEventChange,
      sendWrite: () => Promise<LocalEventChange>,
    ): Promise<boolean> => {
      lastWriteIdRef.current += 1;
      const writeId = lastWriteIdRef.current;
      setOptimisticCalendar((currentCalendar) =>
        currentCalendar === null
          ? currentCalendar
          : startEventWrite(currentCalendar, writeId, localChange),
      );
      try {
        const answeredChange = await sendWrite();
        setOptimisticCalendar((currentCalendar) =>
          currentCalendar === null
            ? currentCalendar
            : confirmEventWrite(currentCalendar, writeId, answeredChange),
        );
        return true;
      } catch (writeError) {
        setOptimisticCalendar((currentCalendar) =>
          currentCalendar === null ? currentCalendar : failEventWrite(currentCalendar, writeId),
        );
        reportAppError(writeError);
        return false;
      }
    },
    [setOptimisticCalendar],
  );

  const runSeriesWrite = useCallback(
    async (localChange: LocalEventChange, sendWrite: () => Promise<unknown>): Promise<boolean> => {
      lastWriteIdRef.current += 1;
      const writeId = lastWriteIdRef.current;
      setOptimisticCalendar((currentCalendar) =>
        currentCalendar === null
          ? currentCalendar
          : startEventWrite(currentCalendar, writeId, localChange),
      );
      try {
        await sendWrite();
      } catch (writeError) {
        setOptimisticCalendar((currentCalendar) =>
          currentCalendar === null ? currentCalendar : failEventWrite(currentCalendar, writeId),
        );
        reportAppError(writeError);
        return false;
      }
      const reloadedRange = shownRangeRef.current;
      try {
        if (reloadedRange === null) throw new Error('no range is shown');
        const rangeRecord = await findCalendarEvents(reloadedRange);
        setOptimisticCalendar((currentCalendar) =>
          currentCalendar === null
            ? currentCalendar
            : confirmEventWriteWithRecords(
                currentCalendar,
                writeId,
                reloadedRange,
                rangeRecord.events,
              ),
        );
        setScheduledMoves(rangeRecord.moves.map(scheduledMoveFromRecord));
      } catch (reloadError) {
        setOptimisticCalendar((currentCalendar) =>
          currentCalendar === null ? currentCalendar : failEventWrite(currentCalendar, writeId),
        );
        reportAppError(reloadError);
      }
      return true;
    },
    [setOptimisticCalendar, setScheduledMoves],
  );

  const reloadAfterWrite = useCallback(async () => {
    const reloadedRange = shownRangeRef.current;
    if (reloadedRange === null) return;
    try {
      const rangeRecord = await findCalendarEvents(reloadedRange);
      if (shownRangeRef.current === reloadedRange) showRangeRecord(reloadedRange, rangeRecord);
    } catch (reloadError) {
      reportAppError(reloadError);
    }
  }, [showRangeRecord]);

  const askOccurrenceScope = useCallback(
    (
      scopeRequest: OccurrenceScopeRequest,
      runScopedWrite: (occurrenceScope: OccurrenceScope) => void,
    ) => {
      scopedWriteRef.current = runScopedWrite;
      setOccurrenceScopeRequest(scopeRequest);
      showPopover(OCCURRENCE_SCOPE_DIALOG_ID);
    },
    [setOccurrenceScopeRequest],
  );

  const handleAnswerOccurrenceScope = useCallback((scopeAnswer: OccurrenceScopeAnswer) => {
    const runScopedWrite = scopedWriteRef.current;
    scopedWriteRef.current = null;
    if (scopeAnswer !== 'cancel') runScopedWrite?.(scopeAnswer);
  }, []);

  const repeatingRecordOf = useCallback(
    (eventId: string) =>
      shownEventRecords.find(
        (eventRecord) => eventRecord.id === eventId && eventRecord.series !== null,
      ),
    [shownEventRecords],
  );

  const handleOpenNewEvent = useCallback(
    (draftTimes: EventTimes | null) => {
      setNewEventDraft(draftTimes ?? nextHourTimes(new Date(), calendarTimeZone));
      showPopover(NEW_EVENT_DIALOG_ID);
    },
    [calendarTimeZone, setNewEventDraft],
  );

  const handleSubmitNewEvent = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const newEventForm = new FormData(submitEvent.currentTarget);
      const pickedZone = readFormText(newEventForm, 'timeZone');
      const repeatRule = readFormRepeatRule(newEventForm, 'repeat');
      const createParams = {
        title: readFormText(newEventForm, 'title'),
        categoryId: readFormCategoryId(newEventForm, `${NEW_EVENT_FIELD_PREFIX}-category`),
        startsAt: readFormMoment(
          newEventForm,
          `${NEW_EVENT_FIELD_PREFIX}-starts`,
          calendarTimeZone,
        ),
        endsAt: readFormMoment(newEventForm, `${NEW_EVENT_FIELD_PREFIX}-ends`, calendarTimeZone),
        inputZone: calendarTimeZone,
        ...(pickedZone === '' || pickedZone === calendarTimeZone ? {} : { timeZone: pickedZone }),
        ...(repeatRule === null ? {} : { repeat: repeatRule }),
      };
      setIsSavingNewEvent(true);
      try {
        const createdRecord = await createPlannedEvent(createParams);
        if (createdRecord.series === null) {
          setOptimisticCalendar((currentCalendar) =>
            currentCalendar === null
              ? currentCalendar
              : takeConfirmedChange(currentCalendar, { kind: 'add', eventRecord: createdRecord }),
          );
        } else {
          await reloadAfterWrite();
        }
        hidePopover(NEW_EVENT_DIALOG_ID);
        setNewEventDraft(null);
        setSelectedEventId(createdRecord.id);
      } catch (createError) {
        reportAppError(createError);
      } finally {
        setIsSavingNewEvent(false);
      }
    },
    [
      calendarTimeZone,
      reloadAfterWrite,
      setIsSavingNewEvent,
      setNewEventDraft,
      setOptimisticCalendar,
      setSelectedEventId,
    ],
  );

  const readPlannedForm = useCallback(
    (eventRecord: CalendarEventRecord | undefined, plannedForm: FormData): PlannedFormChanges => {
      const pickedZone = readFormText(plannedForm, 'timeZone');
      const shownZone = eventRecord?.timeZone ?? calendarTimeZone;
      const repeatRule = readFormRepeatRule(plannedForm, 'repeat');
      return {
        title: readFormText(plannedForm, 'title'),
        categoryId: readFormCategoryId(plannedForm, `${PLANNED_EVENT_FIELD_PREFIX}-category`),
        startsAt: readFormMoment(
          plannedForm,
          `${PLANNED_EVENT_FIELD_PREFIX}-starts`,
          calendarTimeZone,
        ),
        endsAt: readFormMoment(plannedForm, `${PLANNED_EVENT_FIELD_PREFIX}-ends`, calendarTimeZone),
        ...(pickedZone === '' || pickedZone === shownZone ? {} : { timeZone: pickedZone }),
        ...(isSameRule(repeatRule, eventRecord?.series?.repeat ?? null)
          ? {}
          : { repeat: repeatRule }),
      };
    },
    [calendarTimeZone],
  );

  const changeOccurrences = useCallback(
    (
      eventRecord: CalendarEventRecord,
      occurrenceScope: OccurrenceScope,
      plannedChanges: Partial<PlannedFormChanges>,
    ) => {
      const occurrenceKey = seriesOccurrenceKeyOf(eventRecord);
      if (occurrenceKey === null) return;
      const { startsAt, endsAt, ...otherChanges } = plannedChanges;
      const occurrenceTimes =
        startsAt === undefined || endsAt === undefined ? undefined : { startsAt, endsAt };
      void runSeriesWrite(
        {
          kind: 'updateOccurrences',
          eventId: eventRecord.id,
          scope: occurrenceScope,
          eventChanges: {
            ...(otherChanges.title === undefined ? {} : { title: otherChanges.title.trim() }),
            ...(otherChanges.categoryId === undefined
              ? {}
              : { categoryId: otherChanges.categoryId }),
            ...(occurrenceTimes === undefined ? {} : recordTimeChanges(occurrenceTimes)),
          },
        },
        () =>
          changeEventOccurrence({
            occurrenceKey,
            scope: occurrenceScope,
            inputZone: calendarTimeZone,
            ...otherChanges,
            ...(occurrenceTimes === undefined ? {} : { times: occurrenceTimes }),
          }),
      );
    },
    [calendarTimeZone, runSeriesWrite],
  );

  const handleSubmitPlannedEvent = useCallback(
    async (eventId: string, submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const eventRecord = shownEventRecords.find((shownRecord) => shownRecord.id === eventId);
      const plannedChanges = readPlannedForm(eventRecord, new FormData(submitEvent.currentTarget));
      if (eventRecord?.series != null) {
        askOccurrenceScope(
          {
            action: 'change',
            eventTitle: eventRecord.title,
            isRepeatChange: plannedChanges.repeat !== undefined,
          },
          (occurrenceScope) => changeOccurrences(eventRecord, occurrenceScope, plannedChanges),
        );
        return;
      }
      const isWritten = await runEventWrite(
        {
          kind: 'update',
          eventId,
          eventChanges: {
            title: plannedChanges.title.trim(),
            categoryId: plannedChanges.categoryId,
            ...recordTimeChanges(plannedChanges),
          },
        },
        async () =>
          replaceWith(
            await updatePlannedEvent({ eventId, inputZone: calendarTimeZone, ...plannedChanges }),
          ),
      );
      if (isWritten && plannedChanges.repeat !== undefined) await reloadAfterWrite();
    },
    [
      askOccurrenceScope,
      calendarTimeZone,
      changeOccurrences,
      readPlannedForm,
      reloadAfterWrite,
      runEventWrite,
      shownEventRecords,
    ],
  );

  const handleRetimePlannedEvent = useCallback(
    async (eventId: string, eventTimes: EventTimes) => {
      setSelectedEventId(eventId);
      const repeatingRecord = repeatingRecordOf(eventId);
      if (repeatingRecord !== undefined) {
        askOccurrenceScope(
          { action: 'change', eventTitle: repeatingRecord.title },
          (occurrenceScope) => changeOccurrences(repeatingRecord, occurrenceScope, eventTimes),
        );
        return;
      }
      await runEventWrite(
        { kind: 'update', eventId, eventChanges: recordTimeChanges(eventTimes) },
        async () =>
          replaceWith(
            await updatePlannedEvent({ eventId, ...eventTimes, inputZone: calendarTimeZone }),
          ),
      );
    },
    [
      askOccurrenceScope,
      calendarTimeZone,
      changeOccurrences,
      repeatingRecordOf,
      runEventWrite,
      setSelectedEventId,
    ],
  );

  const handleSubmitTrackedTimes = useCallback(
    async (eventId: string, submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const trackedForm = new FormData(submitEvent.currentTarget);
      const startsAt = readFormMoment(
        trackedForm,
        `${TRACKED_EVENT_FIELD_PREFIX}-starts`,
        calendarTimeZone,
      );
      const endsAt = readFormMoment(
        trackedForm,
        `${TRACKED_EVENT_FIELD_PREFIX}-ends`,
        calendarTimeZone,
      );
      await runEventWrite(
        { kind: 'update', eventId, eventChanges: recordTimeChanges({ startsAt, endsAt }) },
        async () =>
          replaceWith(
            await changeTrackedTimes({
              eventId,
              startsAt,
              endsAt,
              inputZone: calendarTimeZone,
              now: new Date(),
            }),
          ),
      );
    },
    [calendarTimeZone, runEventWrite],
  );

  const handleSelectEventCategory = useCallback(
    async (eventId: string, categoryId: string | null) => {
      await runEventWrite({ kind: 'update', eventId, eventChanges: { categoryId } }, async () =>
        replaceWith(await changeEventCategory({ eventId, categoryId })),
      );
    },
    [runEventWrite],
  );

  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      const repeatingRecord = repeatingRecordOf(eventId);
      const occurrenceKey =
        repeatingRecord === undefined ? null : seriesOccurrenceKeyOf(repeatingRecord);
      if (repeatingRecord !== undefined && occurrenceKey !== null) {
        askOccurrenceScope(
          { action: 'delete', eventTitle: repeatingRecord.title },
          (occurrenceScope) => {
            setSelectedEventId(null);
            void runSeriesWrite(
              { kind: 'deleteOccurrences', eventId, scope: occurrenceScope },
              () => deleteEventOccurrence(occurrenceKey, occurrenceScope),
            );
          },
        );
        return;
      }
      setSelectedEventId(null);
      const isDeleted = await runEventWrite({ kind: 'delete', eventId }, async () => {
        await deleteCalendarEvent(eventId);
        return { kind: 'delete', eventId };
      });
      if (!isDeleted) setSelectedEventId(eventId);
    },
    [askOccurrenceScope, repeatingRecordOf, runEventWrite, runSeriesWrite, setSelectedEventId],
  );

  const handleTick = useCallback(() => setNow(new Date()), [setNow]);

  return {
    shownEventRecords,
    calendarTimeZone,
    now,
    handleLoadPage,
    handleReloadRange,
    handleSelectView,
    handleStepRange,
    handleShowToday,
    handleSelectEvent,
    handleOpenNewEvent,
    handleSubmitNewEvent,
    handleSubmitPlannedEvent,
    handleRetimePlannedEvent,
    handleSubmitTrackedTimes,
    handleSelectEventCategory,
    handleDeleteEvent,
    handleAnswerOccurrenceScope,
    handleTick,
  };
};

export default useCalendarEvents;
