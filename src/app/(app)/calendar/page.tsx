import type { Metadata } from 'next';
import CalendarPage from '@/features/calendar/pages/calendar-page';

export const metadata: Metadata = { title: 'Calendar' };

type CalendarRouteProps = {
  searchParams: Promise<{ view?: string; event?: string }>;
};

const CalendarRoute = async ({ searchParams }: CalendarRouteProps) => {
  const { view, event } = await searchParams;
  return (
    <CalendarPage view={view === 'day' ? 'day' : 'week'} selectedEventId={event ?? 'teach-shev'} />
  );
};

export default CalendarRoute;
