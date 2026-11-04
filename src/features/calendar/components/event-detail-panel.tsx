import {
  CalendarClock,
  Clock3,
  History,
  KanbanSquare,
  ListChecks,
  PencilLine,
  Square,
  Trash2,
} from 'lucide-react';
import type { Category } from '@/core/category';
import Badge from '@/core/components/atoms/badge';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import CategoryPicker from '@/core/components/molecules/category-picker';
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
};

const panelClassName = 'grid gap-4 rounded-2xl border border-border bg-background p-4 shadow-soft';

const PlannedEventPanel = ({ calendarEvent, categories }: EventDetailPanelProps) => (
  <section aria-label="Planned event" className={panelClassName}>
    <Badge className="justify-self-start">
      <CalendarClock />
      Planned
    </Badge>
    <Field label="Title" htmlFor="planned-event-title">
      <Input id="planned-event-title" defaultValue={calendarEvent.title} maxLength={200} />
    </Field>
    <CategoryPicker
      name="planned-event-category"
      legend="Category"
      categories={categories}
      selectedCategoryId={calendarEvent.category?.id ?? null}
    />
    <DateTimeField
      label="Starts"
      idPrefix="planned-event-starts"
      moment={calendarEvent.startsAt}
      minuteStep={15}
    />
    <DateTimeField
      label="Ends"
      idPrefix="planned-event-ends"
      moment={calendarEvent.endsAt}
      minuteStep={15}
    />
    <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
      <Button
        variant="ghost"
        size="sm"
        className="text-danger hover:bg-danger-soft hover:text-danger"
      >
        <Trash2 />
        Delete
      </Button>
      <Button size="sm">Save</Button>
    </div>
  </section>
);

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

const RunningEventPanel = ({ calendarEvent, categories, now }: EventDetailPanelProps) => (
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
    />
    <Button size="sm" className="justify-self-start" popoverTarget="finish-task-dialog">
      <Square className="fill-current" />
      Finish
    </Button>
  </section>
);

const TrackedEventPanel = ({ calendarEvent, categories, now }: EventDetailPanelProps) => {
  const trimmedMinutes = trimmedEventMinutes(calendarEvent);
  const finishedAt = calendarEvent.finishedAt;

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
        name="tracked-event-category"
        legend="Category"
        categories={categories}
        selectedCategoryId={calendarEvent.category?.id ?? null}
      />
      <details className="group rounded-xl border border-border open:bg-surface/60">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-foreground hover:bg-surface [&::-webkit-details-marker]:hidden">
          <PencilLine aria-hidden="true" className="size-4 text-muted-foreground" />
          Edit times
        </summary>
        <div className="grid gap-3 px-3 pb-3">
          <DateTimeField
            label="Started"
            idPrefix="tracked-event-starts"
            moment={calendarEvent.startsAt}
          />
          <DateTimeField
            label="Ended"
            idPrefix="tracked-event-ends"
            moment={calendarEvent.endsAt}
          />
          <Button size="sm" className="justify-self-end">
            Save times
          </Button>
        </div>
      </details>
      <Button
        variant="ghost"
        size="sm"
        className="justify-self-start text-danger hover:bg-danger-soft hover:text-danger"
      >
        <Trash2 />
        Delete event
      </Button>
    </section>
  );
};

const EventDetailPanel = (panelProps: EventDetailPanelProps) => {
  if (panelProps.calendarEvent.kind === 'planned') return <PlannedEventPanel {...panelProps} />;
  if (isEventRunning(panelProps.calendarEvent)) return <RunningEventPanel {...panelProps} />;
  return <TrackedEventPanel {...panelProps} />;
};

export default EventDetailPanel;
