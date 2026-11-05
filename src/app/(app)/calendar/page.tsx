import type { Metadata } from 'next';
import CalendarPage from '@/features/calendar/pages/calendar-page';

export const metadata: Metadata = { title: 'Calendar' };

const CalendarRoute = () => <CalendarPage />;

export default CalendarRoute;
