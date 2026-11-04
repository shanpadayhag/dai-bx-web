import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import CalendarAside from '@/features/calendar/components/calendar-aside';
import CalendarGrid, { type CalendarGridDay } from '@/features/calendar/components/calendar-grid';
import CalendarViewSwitch from '@/features/calendar/components/calendar-view-switch';
import NewEventDialog from '@/features/calendar/components/new-event-dialog';
import sampleCalendarSource from '@/features/calendar/data_sources/sample/calendar-source';
import {
  layoutDay,
  splitAtMidnight,
  startOfLocalDay,
  type EventPiece,
} from '@/features/calendar/entities/day-layout';

type CalendarPageProps = {
  view: 'day' | 'week';
  selectedEventId: string | null;
};

const weekTitleFormat = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric' });
const dayTitleFormat = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const dayKey = (dayStart: Date): string => dayStart.toDateString();

const visibleDayStarts = (view: 'day' | 'week', now: Date): Date[] => {
  const todayStart = startOfLocalDay(now);
  if (view === 'day') return [todayStart];
  const mondayOffset = (todayStart.getDay() + 6) % 7;
  return Array.from(
    { length: 7 },
    (_, dayIndex) =>
      new Date(
        todayStart.getFullYear(),
        todayStart.getMonth(),
        todayStart.getDate() - mondayOffset + dayIndex,
      ),
  );
};

const calendarTitle = (view: 'day' | 'week', dayStarts: readonly Date[]): string => {
  const [firstDayStart] = dayStarts;
  const lastDayStart = dayStarts.at(-1);
  if (firstDayStart === undefined || lastDayStart === undefined) return '';
  if (view === 'day') return dayTitleFormat.format(firstDayStart);
  const lastDayLabel =
    firstDayStart.getMonth() === lastDayStart.getMonth()
      ? String(lastDayStart.getDate())
      : weekTitleFormat.format(lastDayStart);
  return `${weekTitleFormat.format(firstDayStart)} – ${lastDayLabel}`;
};

const CalendarPage = ({ view, selectedEventId }: CalendarPageProps) => {
  const now = sampleCalendarSource.findNow();
  const categories = sampleCalendarSource.findCategories();
  const calendarEvents = sampleCalendarSource.findWeekEvents();
  const dayStarts = visibleDayStarts(view, now);
  const todayKey = dayKey(startOfLocalDay(now));

  const piecesByDayKey = new Map<string, EventPiece[]>();
  for (const calendarEvent of calendarEvents) {
    for (const eventPiece of splitAtMidnight(calendarEvent, now)) {
      const pieceDayKey = dayKey(eventPiece.dayStart);
      const dayPieces = piecesByDayKey.get(pieceDayKey) ?? [];
      dayPieces.push(eventPiece);
      piecesByDayKey.set(pieceDayKey, dayPieces);
    }
  }

  const gridDays: CalendarGridDay[] = dayStarts.map((dayStart) => ({
    dayStart,
    isToday: dayKey(dayStart) === todayKey,
    layoutEntries: layoutDay(piecesByDayKey.get(dayKey(dayStart)) ?? []),
  }));
  const selectedEvent =
    calendarEvents.find((calendarEvent) => calendarEvent.id === selectedEventId) ?? null;
  const hrefForEvent = (eventId: string) => `/calendar?view=${view}&event=${eventId}`;
  const isDayView = view === 'day';

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="mr-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {calendarTitle(view, dayStarts)}
          </h1>
          <IconButton label={isDayView ? 'Previous day' : 'Previous week'}>
            <ChevronLeft />
          </IconButton>
          <IconButton label={isDayView ? 'Next day' : 'Next week'}>
            <ChevronRight />
          </IconButton>
          <Button variant="secondary" size="sm">
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <CalendarViewSwitch selectedView={view} />
          <Button popoverTarget="new-event-dialog">
            <Plus />
            New event
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <CalendarGrid
          gridDays={gridDays}
          now={now}
          workingHoursStartMinute={sampleCalendarSource.findWorkingHoursStartMinute()}
          selectedEventId={selectedEventId}
          hrefForEvent={hrefForEvent}
        />
        <CalendarAside categories={categories} selectedEvent={selectedEvent} now={now} />
      </div>
      <NewEventDialog
        categories={categories}
        defaultStartsAt={new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19)}
        defaultEndsAt={new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20)}
      />
    </div>
  );
};

export default CalendarPage;
