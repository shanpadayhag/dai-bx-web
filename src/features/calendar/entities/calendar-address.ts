import { startOfLocalDay } from '@/features/calendar/entities/day-layout';

type CalendarView = 'day' | 'week';

type CalendarAddress = {
  view: CalendarView;
  anchorDay: Date;
};

const CALENDAR_PATH = '/calendar';
const DAY_TEXT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const isCalendarView = (viewText: string | null): viewText is CalendarView =>
  viewText === 'day' || viewText === 'week';

const readDayText = (dayText: string | null): Date | null => {
  const dayMatch = dayText === null ? null : DAY_TEXT_PATTERN.exec(dayText);
  if (dayMatch === null) return null;
  const [year, month, day] = dayMatch.slice(1).map(Number);
  if (year === undefined || month === undefined || day === undefined) return null;
  const readDay = new Date(year, month - 1, day);
  return readDay.getFullYear() === year &&
    readDay.getMonth() === month - 1 &&
    readDay.getDate() === day
    ? readDay
    : null;
};

const formatDayText = (moment: Date): string =>
  `${moment.getFullYear()}-${String(moment.getMonth() + 1).padStart(2, '0')}-${String(moment.getDate()).padStart(2, '0')}`;

const readCalendarAddress = (
  addressSearch: string,
  rememberedView: CalendarView | null,
  today: Date,
): CalendarAddress => {
  const searchParams = new URLSearchParams(addressSearch);
  const addressedView = searchParams.get('view');
  return {
    view: isCalendarView(addressedView) ? addressedView : (rememberedView ?? 'week'),
    anchorDay: readDayText(searchParams.get('date')) ?? startOfLocalDay(today),
  };
};

const calendarPath = (view: CalendarView, anchorDay: Date): string =>
  `${CALENDAR_PATH}?view=${view}&date=${formatDayText(anchorDay)}`;

const shiftAnchorDay = (view: CalendarView, anchorDay: Date, stepCount: number): Date =>
  new Date(
    anchorDay.getFullYear(),
    anchorDay.getMonth(),
    anchorDay.getDate() + stepCount * (view === 'week' ? 7 : 1),
  );

export type { CalendarAddress, CalendarView };
export { calendarPath, formatDayText, isCalendarView, readCalendarAddress, shiftAnchorDay };
