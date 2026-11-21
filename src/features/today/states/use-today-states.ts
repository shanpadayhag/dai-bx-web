import { useState } from 'react';
import type { Category } from '@/core/category';
import type ActivityEntry from '@/features/activity/entities/activity-entry';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import type { UpNext } from '@/features/today/entities/up-next-task';

const useTodayStates = () => {
  const [accountName, setAccountName] = useState<string | null>(null);
  const [categories, setCategories] = useState<readonly Category[]>([]);
  const [eventRecords, setEventRecords] = useState<readonly CalendarEventRecord[] | null>(null);
  const [upNext, setUpNext] = useState<UpNext | null>(null);
  const [activityEntries, setActivityEntries] = useState<readonly ActivityEntry[] | null>(null);
  const [now, setNow] = useState(() => new Date());

  return {
    accountName,
    setAccountName,
    categories,
    setCategories,
    eventRecords,
    setEventRecords,
    upNext,
    setUpNext,
    activityEntries,
    setActivityEntries,
    now,
    setNow,
  };
};

export default useTodayStates;
