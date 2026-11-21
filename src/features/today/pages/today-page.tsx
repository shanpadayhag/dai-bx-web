'use client';

import { useMemo } from 'react';
import { partsInZone } from '@/core/zoned-time';
import ActivityFeed from '@/features/activity/components/activity-feed';
import { calendarEventFromRecord } from '@/features/calendar/entities/calendar-event-record';
import RunningNowList from '@/features/today/components/running-now-list';
import TodayAgenda from '@/features/today/components/today-agenda';
import UpNextList from '@/features/today/components/up-next-list';
import { agendaRowsFrom } from '@/features/today/entities/agenda-row';
import { formatTodayTitle, greetingFor } from '@/features/today/entities/today-day';
import useTodayEvents from '@/features/today/events/use-today-events';
import useTodayStates from '@/features/today/states/use-today-states';
import { useTracking } from '@/features/tracking/states/tracking-context';

const TodayPage = () => {
  const {
    runningItems,
    runningSourceIds,
    trackingRevision,
    calendarTimeZone,
    timeTrackingSettings,
    handleStartTask,
    handleOpenFinish,
    handleCheckIn,
  } = useTracking();
  const states = useTodayStates();
  const { todayDate, handleTickTask } = useTodayEvents(states, {
    calendarTimeZone,
    trackingRevision,
    hasRunningItems: runningItems.length > 0,
  });
  const { accountName, categories, eventRecords, upNext, activityEntries, now } = states;

  const agendaRows = useMemo(() => {
    if (eventRecords === null) return null;
    const categoriesById = new Map(categories.map((category) => [category.id, category]));
    return agendaRowsFrom(
      eventRecords.map((eventRecord) => calendarEventFromRecord(eventRecord, categoriesById)),
      now,
    );
  }, [categories, eventRecords, now]);

  const greeting = greetingFor(partsInZone(now, calendarTimeZone).hour);
  const firstName = accountName?.trim().split(/\s+/)[0] ?? '';

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <header className="grid gap-1">
        <p className="text-sm text-muted-foreground">{formatTodayTitle(todayDate)}</p>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
          {firstName === '' ? greeting : `${greeting}, ${firstName}`}
        </h1>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          <RunningNowList
            runningItems={runningItems}
            timeTrackingSettings={timeTrackingSettings}
            now={now}
            timeZone={calendarTimeZone}
            todayDate={todayDate}
            onCheckIn={handleCheckIn}
            onFinish={handleOpenFinish}
          />
          <UpNextList
            upNextTasks={upNext?.tasks ?? null}
            timeZone={calendarTimeZone}
            todayDate={todayDate}
            runningSourceIds={runningSourceIds}
            onStartTask={handleStartTask}
            onTickTask={handleTickTask}
          />
        </div>
        <div className="grid content-start gap-6">
          <TodayAgenda
            agendaRows={agendaRows}
            timeZone={calendarTimeZone}
            todayDate={todayDate}
            runningSourceIds={runningSourceIds}
            onStartTask={handleStartTask}
          />
          <ActivityFeed activityEntries={activityEntries} timeZone={calendarTimeZone} />
        </div>
      </div>
    </div>
  );
};

export default TodayPage;
