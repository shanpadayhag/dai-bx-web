import { addCalendarDays } from '@/core/zoned-time';

type CalendarView = 'day' | 'week';

type CalendarAddress = {
  view: CalendarView;
  anchorDate: string;
};

const CALENDAR_PATH = '/calendar';
const DATE_TEXT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isCalendarView = (viewText: string | null): viewText is CalendarView =>
  viewText === 'day' || viewText === 'week';

const isRealDate = (dateText: string): boolean =>
  DATE_TEXT_PATTERN.test(dateText) &&
  !Number.isNaN(Date.parse(`${dateText}T00:00:00Z`)) &&
  addCalendarDays(dateText, 0) === dateText;

const readDateText = (dateText: string | null): string | null =>
  dateText !== null && isRealDate(dateText) ? dateText : null;

const readCalendarAddress = (
  addressSearch: string,
  rememberedView: CalendarView | null,
  todayDate: string,
): CalendarAddress => {
  const searchParams = new URLSearchParams(addressSearch);
  const addressedView = searchParams.get('view');
  return {
    view: isCalendarView(addressedView) ? addressedView : (rememberedView ?? 'week'),
    anchorDate: readDateText(searchParams.get('date')) ?? todayDate,
  };
};

const calendarPath = (view: CalendarView, anchorDate: string): string =>
  `${CALENDAR_PATH}?view=${view}&date=${anchorDate}`;

const shiftAnchorDate = (view: CalendarView, anchorDate: string, stepCount: number): string =>
  addCalendarDays(anchorDate, stepCount * (view === 'week' ? 7 : 1));

export type { CalendarAddress, CalendarView };
export { calendarPath, isCalendarView, readCalendarAddress, shiftAnchorDate };
