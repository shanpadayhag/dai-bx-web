import { isCalendarView, type CalendarView } from '@/features/calendar/entities/calendar-address';

const CALENDAR_VIEW_KEY = 'daibx:calendar-view';

const localStorageCalendarViewSource = {
  findView: (): CalendarView | null => {
    try {
      const savedView = window.localStorage.getItem(CALENDAR_VIEW_KEY);
      return isCalendarView(savedView) ? savedView : null;
    } catch {
      return null;
    }
  },
  saveView: (calendarView: CalendarView) => {
    try {
      window.localStorage.setItem(CALENDAR_VIEW_KEY, calendarView);
    } catch {
      return;
    }
  },
};

export default localStorageCalendarViewSource;
