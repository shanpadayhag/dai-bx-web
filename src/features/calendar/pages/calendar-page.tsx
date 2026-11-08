'use client';

import { ChevronLeft, ChevronRight, Plus, RotateCw, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import EmptyState from '@/core/components/molecules/empty-state';
import OccurrenceScopeDialog from '@/core/components/organisms/occurrence-scope-dialog';
import { deviceTimeZone } from '@/core/time-zone';
import CalendarAside from '@/features/calendar/components/calendar-aside';
import CalendarGrid from '@/features/calendar/components/calendar-grid';
import CalendarViewSwitch from '@/features/calendar/components/calendar-view-switch';
import NewEventDialog from '@/features/calendar/components/new-event-dialog';
import sampleRepeatingEventSource from '@/features/calendar/data_sources/sample/repeating-event-source';
import {
  arrangeCalendarDays,
  calendarTitle,
  clockTextMinute,
  visibleDayStarts,
} from '@/features/calendar/entities/calendar-days';
import { calendarEventFromRecord } from '@/features/calendar/entities/calendar-event-record';
import useCalendarEvents, {
  NEW_EVENT_DIALOG_ID,
  NEW_EVENT_FIELD_PREFIX,
  OCCURRENCE_SCOPE_DIALOG_ID,
  PLANNED_EVENT_FIELD_PREFIX,
  TRACKED_EVENT_FIELD_PREFIX,
} from '@/features/calendar/events/use-calendar-events';
import useCalendarStates from '@/features/calendar/states/use-calendar-states';
import { useTracking } from '@/features/tracking/states/tracking-context';

const NOW_TICK_MILLIS = 30_000;
const EVENT_PANEL_ID = 'calendar-event-panel';
const SIDE_BY_SIDE_QUERY = '(min-width: 80rem)';

const CalendarPage = () => {
  const states = useCalendarStates();
  const events = useCalendarEvents(states);
  const { handleLoadPage, handleTick, shownEventRecords, now } = events;
  const { calendarView, anchorDay, categories, selectedEventId } = states;

  const { trackingRevision, handleOpenFinish } = useTracking();
  const { handleReloadRange } = events;
  const shownTrackingRevisionRef = useRef(trackingRevision);

  useEffect(() => {
    void handleLoadPage();
  }, [handleLoadPage]);

  useEffect(() => {
    if (shownTrackingRevisionRef.current === trackingRevision) return;
    shownTrackingRevisionRef.current = trackingRevision;
    handleReloadRange();
  }, [handleReloadRange, trackingRevision]);

  useEffect(() => {
    const tickTimer = window.setInterval(handleTick, NOW_TICK_MILLIS);
    return () => window.clearInterval(tickTimer);
  }, [handleTick]);

  useEffect(() => {
    if (selectedEventId === null || window.matchMedia(SIDE_BY_SIDE_QUERY).matches) return;
    const eventPanel = document.getElementById(EVENT_PANEL_ID);
    if (eventPanel !== null && typeof eventPanel.scrollIntoView === 'function') {
      eventPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedEventId]);

  const dayStarts = useMemo(
    () => (anchorDay === null ? [] : visibleDayStarts(calendarView, anchorDay)),
    [anchorDay, calendarView],
  );

  const calendarEvents = useMemo(() => {
    const categoriesById = new Map(categories.map((category) => [category.id, category]));
    return [
      ...shownEventRecords.map((eventRecord) =>
        calendarEventFromRecord(eventRecord, categoriesById),
      ),
      ...sampleRepeatingEventSource.findOccurrences(dayStarts),
    ];
  }, [categories, dayStarts, shownEventRecords]);

  const scheduledMoves = useMemo(
    () => sampleRepeatingEventSource.findScheduledMoves(dayStarts),
    [dayStarts],
  );

  const calendarTimeZone = useMemo(() => deviceTimeZone(), []);

  const calendarDays = useMemo(
    () => arrangeCalendarDays(dayStarts, calendarEvents, now),
    [calendarEvents, dayStarts, now],
  );

  if (states.optimisticCalendar === null || anchorDay === null) {
    return (
      <div className="grid gap-6">
        {states.pageLoadError === null ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading your calendar…
          </p>
        ) : (
          <EmptyState
            icon={<WifiOff />}
            title={states.pageLoadError.title}
            description={states.pageLoadError.description}
            action={
              <Button variant="secondary" onClick={() => void handleLoadPage()}>
                <RotateCw />
                Try again
              </Button>
            }
          />
        )}
      </div>
    );
  }

  const isDayView = calendarView === 'day';
  const selectedEvent =
    calendarEvents.find((calendarEvent) => calendarEvent.id === selectedEventId) ?? null;
  const repeatingEventOf = (eventId: string) =>
    calendarEvents.find(
      (calendarEvent) => calendarEvent.id === eventId && calendarEvent.series !== undefined,
    );
  const askScopeOrRun = (eventId: string, action: 'change' | 'delete', runWrite: () => void) => {
    const repeatingEvent = repeatingEventOf(eventId);
    if (repeatingEvent === undefined) {
      runWrite();
      return;
    }
    events.handleAskOccurrenceScope({ action, eventTitle: repeatingEvent.title });
  };

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="mr-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {calendarTitle(calendarView, dayStarts)}
          </h1>
          <IconButton
            label={isDayView ? 'Previous day' : 'Previous week'}
            onClick={() => events.handleStepRange(-1)}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            label={isDayView ? 'Next day' : 'Next week'}
            onClick={() => events.handleStepRange(1)}
          >
            <ChevronRight />
          </IconButton>
          <Button variant="secondary" size="sm" onClick={events.handleShowToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <CalendarViewSwitch selectedView={calendarView} onSelectView={events.handleSelectView} />
          <Button onClick={() => events.handleOpenNewEvent(null)}>
            <Plus />
            New event
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <CalendarGrid
          gridDays={calendarDays}
          now={now}
          workingHoursStartMinute={clockTextMinute(states.timeTrackingSettings?.workingHoursStart)}
          selectedEventId={selectedEventId}
          onSelectEvent={events.handleSelectEvent}
          onDraftEvent={events.handleOpenNewEvent}
          scheduledMoves={scheduledMoves}
          onRetimeEvent={(eventId, eventTimes) =>
            askScopeOrRun(
              eventId,
              'change',
              () => void events.handleRetimePlannedEvent(eventId, eventTimes),
            )
          }
        />
        <CalendarAside
          panelId={EVENT_PANEL_ID}
          categories={categories}
          selectedEvent={selectedEvent}
          now={now}
          calendarTimeZone={calendarTimeZone}
          plannedFieldPrefix={PLANNED_EVENT_FIELD_PREFIX}
          trackedFieldPrefix={TRACKED_EVENT_FIELD_PREFIX}
          onSubmitPlannedEvent={(eventId, submitEvent) => {
            submitEvent.preventDefault();
            askScopeOrRun(
              eventId,
              'change',
              () => void events.handleSubmitPlannedEvent(eventId, submitEvent),
            );
          }}
          onSubmitTrackedTimes={(eventId, submitEvent) =>
            void events.handleSubmitTrackedTimes(eventId, submitEvent)
          }
          onSelectCategory={(eventId, categoryId) =>
            askScopeOrRun(
              eventId,
              'change',
              () => void events.handleSelectEventCategory(eventId, categoryId),
            )
          }
          onDeleteEvent={(eventId) =>
            askScopeOrRun(eventId, 'delete', () => void events.handleDeleteEvent(eventId))
          }
          onFinishEvent={handleOpenFinish}
        />
      </div>
      <NewEventDialog
        dialogId={NEW_EVENT_DIALOG_ID}
        fieldPrefix={NEW_EVENT_FIELD_PREFIX}
        categories={categories}
        draftTimes={states.newEventDraft}
        isSaving={states.isSavingNewEvent}
        calendarTimeZone={calendarTimeZone}
        now={now}
        onSubmit={(submitEvent) => void events.handleSubmitNewEvent(submitEvent)}
      />
      <OccurrenceScopeDialog
        id={OCCURRENCE_SCOPE_DIALOG_ID}
        scopeRequest={states.occurrenceScopeRequest}
        onAnswer={events.handleAnswerOccurrenceScope}
      />
    </div>
  );
};

export default CalendarPage;
