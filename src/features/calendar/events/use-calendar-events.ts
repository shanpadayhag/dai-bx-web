import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, type FormEvent } from 'react';
import AppError from '@/core/app-error';
import readFormText from '@/core/form-text';
import type { OccurrenceScopeAnswer, OccurrenceScopeRequest } from '@/core/occurrence-scope';
import hidePopover, { showPopover } from '@/core/popover';
import reportAppError from '@/core/report-app-error';
import changeEventCategory from '@/features/calendar/actions/change-event-category';
import changeTrackedTimes from '@/features/calendar/actions/change-tracked-times';
import createPlannedEvent from '@/features/calendar/actions/create-planned-event';
import deleteCalendarEvent from '@/features/calendar/actions/delete-calendar-event';
import findCalendarEvents from '@/features/calendar/actions/find-calendar-events';
import updatePlannedEvent from '@/features/calendar/actions/update-planned-event';
import localStorageCalendarViewSource from '@/features/calendar/data_sources/local_storage/calendar-view-source';
import {
  calendarPath,
  readCalendarAddress,
  shiftAnchorDay,
  type CalendarView,
} from '@/features/calendar/entities/calendar-address';
import type { EventTimes } from '@/features/calendar/entities/calendar-drag';
import type { LocalEventChange } from '@/features/calendar/entities/calendar-event-changes';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import { dayRange, weekRange } from '@/features/calendar/entities/calendar-range';
import { startOfLocalDay } from '@/features/calendar/entities/day-layout';
import { readFormCategoryId, readFormMoment } from '@/features/calendar/entities/form-moment';
import {
  confirmEventWrite,
  failEventWrite,
  startEventWrite,
  startOptimisticCalendar,
  takeConfirmedChange,
  visibleEventRecords,
} from '@/features/calendar/entities/optimistic-calendar';
import type useCalendarStates from '@/features/calendar/states/use-calendar-states';
import findCategories from '@/features/categories/actions/find-categories';
import findTimeTrackingSettings from '@/features/tracking/actions/find-time-tracking-settings';

export const NEW_EVENT_DIALOG_ID = 'new-event-dialog';
export const NEW_EVENT_FIELD_PREFIX = 'new-event';
export const PLANNED_EVENT_FIELD_PREFIX = 'planned-event';
export const TRACKED_EVENT_FIELD_PREFIX = 'tracked-event';
export const OCCURRENCE_SCOPE_DIALOG_ID = 'occurrence-scope-dialog';

const rangeOf = (calendarView: CalendarView, anchorDay: Date) =>
  calendarView === 'week' ? weekRange(anchorDay) : dayRange(anchorDay);

const replaceWith = (answeredRecord: CalendarEventRecord): LocalEventChange => ({
  kind: 'replace',
  eventRecord: answeredRecord,
});

const nextHourTimes = (now: Date): EventTimes => ({
  startsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1),
  endsAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 2),
});

const useCalendarEvents = (states: ReturnType<typeof useCalendarStates>) => {
  const {
    calendarView,
    anchorDay,
    optimisticCalendar,
    now,
    setNow,
    setCalendarView,
    setAnchorDay,
    setCategories,
    setTimeTrackingSettings,
    setOptimisticCalendar,
    setPageLoadError,
    setSelectedEventId,
    setNewEventDraft,
    setIsSavingNewEvent,
    setOccurrenceScopeRequest,
  } = states;
  const router = useRouter();
  const lastWriteIdRef = useRef(0);
  const lastRangeLoadIdRef = useRef(0);

  const shownEventRecords = useMemo(
    () => (optimisticCalendar === null ? [] : visibleEventRecords(optimisticCalendar)),
    [optimisticCalendar],
  );

  const loadRange = useCallback(
    async (shownView: CalendarView, shownAnchorDay: Date) => {
      lastRangeLoadIdRef.current += 1;
      const rangeLoadId = lastRangeLoadIdRef.current;
      const shownRange = rangeOf(shownView, shownAnchorDay);
      try {
        const rangeRecords = await findCalendarEvents(shownRange);
        if (rangeLoadId !== lastRangeLoadIdRef.current) return;
        setOptimisticCalendar(startOptimisticCalendar(shownRange, rangeRecords));
      } catch (rangeError) {
        reportAppError(rangeError);
      }
    },
    [setOptimisticCalendar],
  );

  const showRange = useCallback(
    async (shownView: CalendarView, shownAnchorDay: Date) => {
      setCalendarView(shownView);
      setAnchorDay(shownAnchorDay);
      router.replace(calendarPath(shownView, shownAnchorDay), { scroll: false });
      await loadRange(shownView, shownAnchorDay);
    },
    [loadRange, router, setAnchorDay, setCalendarView],
  );

  const handleReloadRange = useCallback(() => {
    if (anchorDay !== null) void loadRange(calendarView, anchorDay);
  }, [anchorDay, calendarView, loadRange]);

  const handleLoadPage = useCallback(async () => {
    setPageLoadError(null);
    const calendarAddress = readCalendarAddress(
      window.location.search,
      localStorageCalendarViewSource.findView(),
      new Date(),
    );
    const shownRange = rangeOf(calendarAddress.view, calendarAddress.anchorDay);
    lastRangeLoadIdRef.current += 1;
    try {
      const [loadedCategories, loadedSettings, rangeRecords] = await Promise.all([
        findCategories(),
        findTimeTrackingSettings(),
        findCalendarEvents(shownRange),
      ]);
      setCategories(loadedCategories);
      setTimeTrackingSettings(loadedSettings);
      setCalendarView(calendarAddress.view);
      setAnchorDay(calendarAddress.anchorDay);
      setOptimisticCalendar(startOptimisticCalendar(shownRange, rangeRecords));
    } catch (pageError) {
      if (!(pageError instanceof AppError)) throw pageError;
      setPageLoadError(pageError);
    }
  }, [
    setAnchorDay,
    setCalendarView,
    setCategories,
    setOptimisticCalendar,
    setPageLoadError,
    setTimeTrackingSettings,
  ]);

  const handleSelectView = useCallback(
    (chosenView: CalendarView) => {
      if (anchorDay === null || chosenView === calendarView) return;
      localStorageCalendarViewSource.saveView(chosenView);
      void showRange(chosenView, anchorDay);
    },
    [anchorDay, calendarView, showRange],
  );

  const handleStepRange = useCallback(
    (stepCount: number) => {
      if (anchorDay === null) return;
      void showRange(calendarView, shiftAnchorDay(calendarView, anchorDay, stepCount));
    },
    [anchorDay, calendarView, showRange],
  );

  const handleShowToday = useCallback(() => {
    void showRange(calendarView, startOfLocalDay(new Date()));
  }, [calendarView, showRange]);

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

  const handleOpenNewEvent = useCallback(
    (draftTimes: EventTimes | null) => {
      setNewEventDraft(draftTimes ?? nextHourTimes(new Date()));
      showPopover(NEW_EVENT_DIALOG_ID);
    },
    [setNewEventDraft],
  );

  const handleSubmitNewEvent = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const newEventForm = new FormData(submitEvent.currentTarget);
      const createParams = {
        title: readFormText(newEventForm, 'title'),
        categoryId: readFormCategoryId(newEventForm, `${NEW_EVENT_FIELD_PREFIX}-category`),
        startsAt: readFormMoment(newEventForm, `${NEW_EVENT_FIELD_PREFIX}-starts`),
        endsAt: readFormMoment(newEventForm, `${NEW_EVENT_FIELD_PREFIX}-ends`),
      };
      setIsSavingNewEvent(true);
      try {
        const createdRecord = await createPlannedEvent(createParams);
        setOptimisticCalendar((currentCalendar) =>
          currentCalendar === null
            ? currentCalendar
            : takeConfirmedChange(currentCalendar, { kind: 'add', eventRecord: createdRecord }),
        );
        hidePopover(NEW_EVENT_DIALOG_ID);
        setNewEventDraft(null);
        setSelectedEventId(createdRecord.id);
      } catch (createError) {
        reportAppError(createError);
      } finally {
        setIsSavingNewEvent(false);
      }
    },
    [setIsSavingNewEvent, setNewEventDraft, setOptimisticCalendar, setSelectedEventId],
  );

  const handleSubmitPlannedEvent = useCallback(
    async (eventId: string, submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const plannedForm = new FormData(submitEvent.currentTarget);
      const updateParams = {
        eventId,
        title: readFormText(plannedForm, 'title'),
        categoryId: readFormCategoryId(plannedForm, `${PLANNED_EVENT_FIELD_PREFIX}-category`),
        startsAt: readFormMoment(plannedForm, `${PLANNED_EVENT_FIELD_PREFIX}-starts`),
        endsAt: readFormMoment(plannedForm, `${PLANNED_EVENT_FIELD_PREFIX}-ends`),
      };
      await runEventWrite(
        {
          kind: 'update',
          eventId,
          eventChanges: {
            title: updateParams.title.trim(),
            categoryId: updateParams.categoryId,
            ...(Number.isNaN(updateParams.startsAt.getTime())
              ? {}
              : { startsAt: updateParams.startsAt.toISOString() }),
            ...(Number.isNaN(updateParams.endsAt.getTime())
              ? {}
              : { endsAt: updateParams.endsAt.toISOString() }),
          },
        },
        async () => replaceWith(await updatePlannedEvent(updateParams)),
      );
    },
    [runEventWrite],
  );

  const handleRetimePlannedEvent = useCallback(
    async (eventId: string, eventTimes: EventTimes) => {
      setSelectedEventId(eventId);
      await runEventWrite(
        {
          kind: 'update',
          eventId,
          eventChanges: {
            startsAt: eventTimes.startsAt.toISOString(),
            endsAt: eventTimes.endsAt.toISOString(),
          },
        },
        async () => replaceWith(await updatePlannedEvent({ eventId, ...eventTimes })),
      );
    },
    [runEventWrite, setSelectedEventId],
  );

  const handleSubmitTrackedTimes = useCallback(
    async (eventId: string, submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const trackedForm = new FormData(submitEvent.currentTarget);
      const startsAt = readFormMoment(trackedForm, `${TRACKED_EVENT_FIELD_PREFIX}-starts`);
      const endsAt = readFormMoment(trackedForm, `${TRACKED_EVENT_FIELD_PREFIX}-ends`);
      const hasBothTimes = !Number.isNaN(startsAt.getTime()) && !Number.isNaN(endsAt.getTime());
      await runEventWrite(
        {
          kind: 'update',
          eventId,
          eventChanges: hasBothTimes
            ? { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() }
            : {},
        },
        async () =>
          replaceWith(await changeTrackedTimes({ eventId, startsAt, endsAt, now: new Date() })),
      );
    },
    [runEventWrite],
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
      setSelectedEventId(null);
      const isDeleted = await runEventWrite({ kind: 'delete', eventId }, async () => {
        await deleteCalendarEvent(eventId);
        return { kind: 'delete', eventId };
      });
      if (!isDeleted) setSelectedEventId(eventId);
    },
    [runEventWrite, setSelectedEventId],
  );

  const handleAskOccurrenceScope = useCallback(
    (scopeRequest: OccurrenceScopeRequest) => {
      setOccurrenceScopeRequest(scopeRequest);
      showPopover(OCCURRENCE_SCOPE_DIALOG_ID);
    },
    [setOccurrenceScopeRequest],
  );

  const handleAnswerOccurrenceScope = useCallback(
    (scopeAnswer: OccurrenceScopeAnswer) => {
      if (scopeAnswer === 'cancel') return;
      setOccurrenceScopeRequest(null);
    },
    [setOccurrenceScopeRequest],
  );

  const handleTick = useCallback(() => setNow(new Date()), [setNow]);

  return {
    shownEventRecords,
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
    handleAskOccurrenceScope,
    handleAnswerOccurrenceScope,
    handleTick,
  };
};

export default useCalendarEvents;
