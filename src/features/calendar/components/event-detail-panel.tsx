import {
  CalendarClock,
  Clock3,
  Globe2,
  History,
  KanbanSquare,
  ListChecks,
  PencilLine,
  Square,
  Trash2,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { Category } from '@/core/category';
import Badge from '@/core/components/atoms/badge';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import CategoryPicker from '@/core/components/molecules/category-picker';
import MoreOptions from '@/core/components/molecules/more-options';
import TimeZoneField from '@/core/components/molecules/time-zone-field';
import RepeatPicker from '@/core/components/organisms/repeat-picker';
import localCalendarDate from '@/core/local-date';
import { formatClockInZone, timeZonePlaceName } from '@/core/time-zone';
import DateTimeField from '@/features/calendar/components/date-time-field';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';
import { isEventRunning, trimmedEventMinutes } from '@/features/calendar/entities/calendar-event';
import {
  eventDurationMinutes,
  formatClock,
  formatDurationMinutes,
  formatEventTimeRange,
} from '@/features/calendar/entities/event-time';

const eventDayFormat = new Intl.DateTimeFormat('en', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

type EventDetailPanelProps = {
  calendarEvent: CalendarEvent;
  categories: readonly Category[];
  now: Date;
  calendarTimeZone: string;
  plannedFieldPrefix: string;
  trackedFieldPrefix: string;
  onSubmitPlannedEvent: (eventId: string, submitEvent: FormEvent<HTMLFormElement>) => void;
  onSubmitTrackedTimes: (eventId: string, submitEvent: FormEvent<HTMLFormElement>) => void;
  onSelectCategory: (eventId: string, categoryId: string | null) => void;
  onDeleteEvent: (eventId: string) => void;
  onFinishEvent: (eventId: string) => void;
};

const panelClassName = 'grid gap-4 rounded-2xl border border-border bg-background p-4 shadow-soft';

const OtherZoneTimes = ({
  calendarEvent,
  eventTimeZone,
}: {
  calendarEvent: CalendarEvent;
  eventTimeZone: string;
}) => (
  <p className="flex items-start gap-2 rounded-xl bg-surface px-3 py-2.5 text-[13px] text-muted-foreground">
    <Globe2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
    <span>
      <span className="font-mono text-foreground tabular-nums">
        {formatClockInZone(calendarEvent.startsAt, eventTimeZone)} –{' '}
        {calendarEvent.endsAt === null
          ? 'now'
          : formatClockInZone(calendarEvent.endsAt, eventTimeZone)}
      </span>{' '}
      in {timeZonePlaceName(eventTimeZone)}, which is{' '}
      <span className="font-mono text-foreground tabular-nums">
        {formatEventTimeRange(calendarEvent)}
      </span>{' '}
      on your calendar.
    </span>
  </p>
);

const PlannedEventPanel = ({
  calendarEvent,
  categories,
  now,
  calendarTimeZone,
  plannedFieldPrefix,
  onSubmitPlannedEvent,
  onDeleteEvent,
}: EventDetailPanelProps) => {
  const eventTimeZone = calendarEvent.timeZone ?? calendarTimeZone;

  return (
    <section aria-label="Planned event" className={panelClassName}>
      <form
        noValidate
        className="grid gap-4"
        onSubmit={(submitEvent) => onSubmitPlannedEvent(calendarEvent.id, submitEvent)}
      >
        <Badge className="justify-self-start">
          <CalendarClock />
          {calendarEvent.series === undefined ? 'Planned' : 'Planned, repeats'}
        </Badge>
        {eventTimeZone === calendarTimeZone ? null : (
          <OtherZoneTimes calendarEvent={calendarEvent} eventTimeZone={eventTimeZone} />
        )}
        <Field label="Title" htmlFor={`${plannedFieldPrefix}-title`}>
          <Input
            id={`${plannedFieldPrefix}-title`}
            name="title"
            defaultValue={calendarEvent.title}
            maxLength={200}
          />
        </Field>
        <CategoryPicker
          name={`${plannedFieldPrefix}-category`}
          legend="Category"
          categories={categories}
          selectedCategoryId={calendarEvent.category?.id ?? null}
        />
        <DateTimeField
          label="Starts"
          idPrefix={`${plannedFieldPrefix}-starts`}
          moment={calendarEvent.startsAt}
          minuteStep={15}
        />
        <DateTimeField
          label="Ends"
          idPrefix={`${plannedFieldPrefix}-ends`}
          moment={calendarEvent.endsAt}
          minuteStep={15}
        />
        <RepeatPicker
          idPrefix={`${plannedFieldPrefix}-repeat`}
          name="repeat"
          firstDate={localCalendarDate(
            calendarEvent.series?.originalStart ?? calendarEvent.startsAt,
          )}
          initialRule={calendarEvent.series?.repeatRule ?? null}
        />
        <MoreOptions>
          <TimeZoneField
            id={`${plannedFieldPrefix}-time-zone`}
            name="timeZone"
            label="Time zone"
            hint="The event keeps its time in this zone, even across daylight saving."
            selectedTimeZone={eventTimeZone}
            now={now}
          />
        </MoreOptions>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger-soft hover:text-danger"
            onClick={() => onDeleteEvent(calendarEvent.id)}
          >
            <Trash2 />
            Delete
          </Button>
          <Button type="submit" size="sm">
            Save
          </Button>
        </div>
      </form>
    </section>
  );
};

const SourceBadgeContent = ({ calendarEvent }: { calendarEvent: CalendarEvent }) =>
  calendarEvent.source?.kind === 'card' ? (
    <>
      <KanbanSquare />
      From a card
    </>
  ) : (
    <>
      <ListChecks />
      From a task
    </>
  );

const RunningEventPanel = ({
  calendarEvent,
  categories,
  now,
  onSelectCategory,
  onFinishEvent,
}: EventDetailPanelProps) => (
  <section aria-label="Event being tracked" className={panelClassName}>
    <div className="flex flex-wrap gap-1.5">
      <Badge tone="primary">
        <span className="size-1.5 animate-pulse-dot rounded-full bg-primary" />
        Tracking now
      </Badge>
      <Badge>
        <SourceBadgeContent calendarEvent={calendarEvent} />
      </Badge>
    </div>
    <div className="grid gap-1">
      <h2 className="text-base font-semibold text-balance text-foreground">
        {calendarEvent.title}
      </h2>
      <p className="text-[13px] text-muted-foreground">
        Started {formatClock(calendarEvent.startsAt)} ·{' '}
        <span className="font-mono tabular-nums">
          {formatDurationMinutes(eventDurationMinutes(calendarEvent, now))}
        </span>{' '}
        so far
      </p>
    </div>
    <CategoryPicker
      name="running-event-category"
      legend="Category"
      categories={categories}
      selectedCategoryId={calendarEvent.category?.id ?? null}
      onSelectCategory={(categoryId) => onSelectCategory(calendarEvent.id, categoryId)}
    />
    <Button
      size="sm"
      className="justify-self-start"
      onClick={() => onFinishEvent(calendarEvent.id)}
    >
      <Square className="fill-current" />
      Finish
    </Button>
  </section>
);

const TrackedEventPanel = ({
  calendarEvent,
  categories,
  now,
  trackedFieldPrefix,
  onSubmitTrackedTimes,
  onSelectCategory,
  onDeleteEvent,
}: EventDetailPanelProps) => {
  const trimmedMinutes = trimmedEventMinutes(calendarEvent);
  const finishedAt = calendarEvent.finishedAt;
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <section aria-label="Tracked event" className={panelClassName}>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="primary">
          <SourceBadgeContent calendarEvent={calendarEvent} />
        </Badge>
        {trimmedMinutes > 0 ? <Badge tone="warning">{trimmedMinutes} min trimmed</Badge> : null}
      </div>
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-balance text-foreground">
          {calendarEvent.title}
        </h2>
        <p className="text-[13px] text-muted-foreground">
          {eventDayFormat.format(calendarEvent.startsAt)}
        </p>
      </div>
      <dl className="grid gap-2.5 text-[13px]">
        <div className="flex items-center gap-2.5">
          <dt className="sr-only">Time</dt>
          <Clock3 aria-hidden="true" className="size-4 text-muted-foreground" />
          <dd className="font-mono text-foreground tabular-nums">
            {formatEventTimeRange(calendarEvent)} ·{' '}
            {formatDurationMinutes(eventDurationMinutes(calendarEvent, now))}
          </dd>
        </div>
        {trimmedMinutes > 0 && finishedAt !== null ? (
          <div className="flex items-start gap-2.5">
            <dt className="sr-only">Why it ends there</dt>
            <History aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <dd className="text-muted-foreground">
              Ends at your last check-in, {trimmedMinutes} minutes before you finished at{' '}
              {formatClock(finishedAt)}.
            </dd>
          </div>
        ) : null}
      </dl>
      <CategoryPicker
        name={`${trackedFieldPrefix}-category`}
        legend="Category"
        categories={categories}
        selectedCategoryId={calendarEvent.category?.id ?? null}
        onSelectCategory={(categoryId) => onSelectCategory(calendarEvent.id, categoryId)}
      />
      <details className="group rounded-xl border border-border open:bg-surface/60">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-foreground hover:bg-surface [&::-webkit-details-marker]:hidden">
          <PencilLine aria-hidden="true" className="size-4 text-muted-foreground" />
          Edit times
        </summary>
        <form
          noValidate
          className="grid gap-3 px-3 pb-3"
          onSubmit={(submitEvent) => onSubmitTrackedTimes(calendarEvent.id, submitEvent)}
        >
          <DateTimeField
            label="Started"
            idPrefix={`${trackedFieldPrefix}-starts`}
            moment={calendarEvent.startsAt}
          />
          <DateTimeField
            label="Ended"
            idPrefix={`${trackedFieldPrefix}-ends`}
            moment={calendarEvent.endsAt}
          />
          <Button type="submit" size="sm" className="justify-self-end">
            Save times
          </Button>
        </form>
      </details>
      {isConfirmingDelete ? (
        <div
          role="group"
          aria-label="Delete this event?"
          className="grid gap-2.5 rounded-xl border border-danger/30 bg-danger-soft/60 p-3"
        >
          <p className="text-[13px] text-foreground">
            Delete this tracked event? The time it recorded goes with it.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmingDelete(false)}>
              Keep it
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDeleteEvent(calendarEvent.id)}>
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="justify-self-start text-danger hover:bg-danger-soft hover:text-danger"
          onClick={() => setIsConfirmingDelete(true)}
        >
          <Trash2 />
          Delete event
        </Button>
      )}
    </section>
  );
};

const EventDetailPanel = (panelProps: EventDetailPanelProps) => {
  if (panelProps.calendarEvent.kind === 'planned') return <PlannedEventPanel {...panelProps} />;
  if (isEventRunning(panelProps.calendarEvent)) return <RunningEventPanel {...panelProps} />;
  return <TrackedEventPanel {...panelProps} />;
};

export default EventDetailPanel;
