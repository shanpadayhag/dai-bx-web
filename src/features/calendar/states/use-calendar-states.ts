import { useState } from 'react';
import type AppError from '@/core/app-error';
import type { Category } from '@/core/category';
import type { OccurrenceScopeRequest } from '@/core/occurrence-scope';
import type { CalendarView } from '@/features/calendar/entities/calendar-address';
import type { EventTimes } from '@/features/calendar/entities/calendar-drag';
import type { OptimisticCalendar } from '@/features/calendar/entities/optimistic-calendar';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';

const useCalendarStates = () => {
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [anchorDay, setAnchorDay] = useState<Date | null>(null);
  const [categories, setCategories] = useState<readonly Category[]>([]);
  const [timeTrackingSettings, setTimeTrackingSettings] = useState<TimeTrackingSettings | null>(
    null,
  );
  const [optimisticCalendar, setOptimisticCalendar] = useState<OptimisticCalendar | null>(null);
  const [pageLoadError, setPageLoadError] = useState<AppError | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [newEventDraft, setNewEventDraft] = useState<EventTimes | null>(null);
  const [isSavingNewEvent, setIsSavingNewEvent] = useState(false);
  const [occurrenceScopeRequest, setOccurrenceScopeRequest] =
    useState<OccurrenceScopeRequest | null>(null);
  const [now, setNow] = useState(() => new Date());

  return {
    calendarView,
    setCalendarView,
    anchorDay,
    setAnchorDay,
    categories,
    setCategories,
    timeTrackingSettings,
    setTimeTrackingSettings,
    optimisticCalendar,
    setOptimisticCalendar,
    pageLoadError,
    setPageLoadError,
    selectedEventId,
    setSelectedEventId,
    newEventDraft,
    setNewEventDraft,
    isSavingNewEvent,
    setIsSavingNewEvent,
    occurrenceScopeRequest,
    setOccurrenceScopeRequest,
    now,
    setNow,
  };
};

export default useCalendarStates;
