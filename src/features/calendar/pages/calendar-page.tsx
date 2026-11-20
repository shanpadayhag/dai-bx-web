'use client';

import { ChevronLeft, ChevronRight, Plus, RotateCw, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import EmptyState from '@/core/components/molecules/empty-state';
import OccurrenceScopeDialog from '@/core/components/organisms/occurrence-scope-dialog';
import CalendarAside from '@/features/calendar/components/calendar-aside';
import CalendarGrid from '@/features/calendar/components/calendar-grid';
import CalendarViewSwitch from '@/features/calendar/components/calendar-view-switch';
import NewEventDialog from '@/features/calendar/components/new-event-dialog';
import {
  arrangeCalendarDays,
  calendarTitle,
  clockTextMinute,
  shownRangeOf,
} from '@/features/calendar/entities/calendar-days';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';
import { canLinkTask } from '@/features/calendar/entities/calendar-event';
import { calendarEventFromRecord } from '@/features/calendar/entities/calendar-event-record';
import { calendarDatesOf } from '@/features/calendar/entities/calendar-range';
import useCalendarEvents, {
  NEW_EVENT_DIALOG_ID,
  NEW_EVENT_FIELD_PREFIX,
  OCCURRENCE_SCOPE_DIALOG_ID,
  PLANNED_EVENT_FIELD_PREFIX,
  TRACKED_EVENT_FIELD_PREFIX,
} from '@/features/calendar/events/use-calendar-events';
import useCalendarStates from '@/features/calendar/states/use-calendar-states';
import PlanPanel from '@/features/planning/components/plan-panel';
import PlanPopover from '@/features/planning/components/plan-popover';
import { proposedEventId, proposedTaskIdOf } from '@/features/planning/entities/plan';
import usePlanEvents, { PLAN_POPOVER_ID } from '@/features/planning/events/use-plan-events';
import usePlanStates from '@/features/planning/states/use-plan-states';
import { useTracking } from '@/features/tracking/states/tracking-context';

const NOW_TICK_MILLIS = 30_000;
const EVENT_PANEL_ID = 'calendar-event-panel';
const SIDE_BY_SIDE_QUERY = '(min-width: 80rem)';

const CalendarPage = () => {
  const states = useCalendarStates();
  const events = useCalendarEvents(states);
  const { handleLoadPage, handleTick, shownEventRecords, calendarTimeZone, now } = events;
  const { calendarView, anchorDate, categories, selectedEventId } = states;

  const { trackingRevision, handleOpenFinish, handleStartTask, runningSourceIds } = useTracking();
  const { handleReloadRange, handleLoadTaskGroups } = events;
  const planStates = usePlanStates();
  const allGroupIds = useMemo(
    () => (states.taskGroupChoices ?? []).map((taskGroup) => taskGroup.id),
    [states.taskGroupChoices],
  );
  const planEvents = usePlanEvents(planStates, {
    allGroupIds,
    onShowPlanDays: events.handleShowPlanDays,
    onPlanAccepted: handleReloadRange,
  });
  const { plan } = planStates;
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

  const calendarDates = useMemo(
    () =>
      anchorDate === null
        ? []
        : calendarDatesOf(shownRangeOf(calendarView, anchorDate, calendarTimeZone)),
    [anchorDate, calendarTimeZone, calendarView],
  );

  const calendarEvents = useMemo(() => {
    const categoriesById = new Map(categories.map((category) => [category.id, category]));
    return shownEventRecords.map((eventRecord) =>
      calendarEventFromRecord(eventRecord, categoriesById),
    );
  }, [categories, shownEventRecords]);

  const selectedEvent =
    calendarEvents.find((calendarEvent) => calendarEvent.id === selectedEventId) ?? null;
  const isTaskFieldShown = selectedEvent !== null && canLinkTask(selectedEvent);

  useEffect(() => {
    if (isTaskFieldShown) void handleLoadTaskGroups();
  }, [handleLoadTaskGroups, isTaskFieldShown]);

  const shownEvents = useMemo(
    () => [
      ...calendarEvents,
      ...(plan?.blocks ?? []).map((proposedBlock): CalendarEvent => ({
        id: proposedEventId(proposedBlock.taskId),
        kind: 'planned',
        title: proposedBlock.taskName,
        category: null,
        startsAt: proposedBlock.startsAt,
        endsAt: proposedBlock.endsAt,
        finishedAt: null,
        source: null,
        proposal: { isLate: proposedBlock.isLate },
      })),
    ],
    [calendarEvents, plan],
  );

  const calendarDays = useMemo(
    () => arrangeCalendarDays(calendarDates, shownEvents, now, calendarTimeZone),
    [shownEvents, calendarTimeZone, calendarDates, now],
  );

  if (states.optimisticCalendar === null || anchorDate === null) {
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

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="mr-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {calendarTitle(calendarView, calendarDates)}
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
          <PlanPopover
            popoverId={PLAN_POPOVER_ID}
            planChoice={planStates.planChoice}
            taskGroups={states.taskGroupChoices}
            isAskingPlan={planStates.isAskingPlan}
            onOpen={() => void handleLoadTaskGroups()}
            onMakePlan={planEvents.handleMakePlan}
          />
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
          scheduledMoves={states.scheduledMoves}
          timeZone={calendarTimeZone}
          onRetimeEvent={(eventId, eventTimes) => {
            const proposedTaskId = proposedTaskIdOf(eventId);
            if (proposedTaskId === null) {
              void events.handleRetimePlannedEvent(eventId, eventTimes);
              return;
            }
            events.handleSelectEvent(eventId);
            planEvents.handlePinBlock(proposedTaskId, eventTimes);
          }}
        />
        <CalendarAside
          panelId={EVENT_PANEL_ID}
          categories={categories}
          selectedEvent={selectedEvent}
          now={now}
          calendarTimeZone={calendarTimeZone}
          plannedFieldPrefix={PLANNED_EVENT_FIELD_PREFIX}
          trackedFieldPrefix={TRACKED_EVENT_FIELD_PREFIX}
          onSubmitPlannedEvent={(eventId, submitEvent) =>
            void events.handleSubmitPlannedEvent(eventId, submitEvent)
          }
          onSubmitTrackedTimes={(eventId, submitEvent) =>
            void events.handleSubmitTrackedTimes(eventId, submitEvent)
          }
          onSelectCategory={(eventId, categoryId) =>
            void events.handleSelectEventCategory(eventId, categoryId)
          }
          onDeleteEvent={(eventId) => void events.handleDeleteEvent(eventId)}
          onFinishEvent={handleOpenFinish}
          runningSourceIds={runningSourceIds}
          taskGroups={states.taskGroupChoices}
          taskChoicesByGroupId={states.taskChoicesByGroupId}
          onLoadGroupTasks={events.handleLoadGroupTasks}
          onStartTask={handleStartTask}
          planPanel={
            plan === null ? null : (
              <PlanPanel
                plan={plan}
                timeZone={calendarTimeZone}
                selectedTaskId={selectedEventId === null ? null : proposedTaskIdOf(selectedEventId)}
                isAskingPlan={planStates.isAskingPlan}
                isAcceptingPlan={planStates.isAcceptingPlan}
                onSelectBlock={(taskId) => events.handleSelectEvent(proposedEventId(taskId))}
                onAcceptBlock={planEvents.handleAcceptBlock}
                onRejectBlock={planEvents.handleRejectBlock}
                onAcceptAll={planEvents.handleAcceptAll}
                onDiscard={planEvents.handleDiscardPlan}
              />
            )
          }
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
