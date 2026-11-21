'use client';

import { useEffect } from 'react';
import Button from '@/core/components/atoms/button';
import ActivityEntryList from '@/features/activity/components/activity-entry-list';
import { groupActivityByDay } from '@/features/activity/entities/activity-entry';
import useActivityEvents from '@/features/activity/events/use-activity-events';
import useActivityStates from '@/features/activity/states/use-activity-states';
import { useTracking } from '@/features/tracking/states/tracking-context';

const ActivityPage = () => {
  const { calendarTimeZone } = useTracking();
  const states = useActivityStates();
  const { handleLoadFirstPage, handleLoadMore } = useActivityEvents(states);
  const { activityEntries, nextCursor, isLoadingMore, hasLoadError } = states;

  useEffect(() => {
    void handleLoadFirstPage();
  }, [handleLoadFirstPage]);

  const activityDays =
    activityEntries === null
      ? []
      : groupActivityByDay(activityEntries, calendarTimeZone, new Date());

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Activity</h1>
        <p className="text-sm text-muted-foreground">
          What you started, finished, ticked and moved, newest first.
        </p>
      </header>
      {hasLoadError ? (
        <section className="grid justify-items-start gap-3 rounded-2xl border border-border bg-background p-5 shadow-soft">
          <p className="text-[13px] text-foreground">Activity didn&apos;t load.</p>
          <Button variant="secondary" size="sm" onClick={() => void handleLoadFirstPage()}>
            Try again
          </Button>
        </section>
      ) : activityEntries === null ? (
        <p className="text-[13px] text-muted-foreground">Loading…</p>
      ) : activityEntries.length === 0 ? (
        <section className="grid gap-1 rounded-2xl border border-border bg-background p-5 shadow-soft">
          <h2 className="text-[13px] font-semibold text-foreground">No activity yet</h2>
          <p className="text-[13px] text-muted-foreground">
            Start a task, tick one off or move a card, and it shows up here.
          </p>
        </section>
      ) : (
        <>
          {activityDays.map((activityDay) => (
            <section
              key={activityDay.calendarDate}
              aria-label={activityDay.dayLabel}
              className="grid gap-3 rounded-2xl border border-border bg-background p-5 shadow-soft"
            >
              <h2 className="text-[13px] font-semibold text-foreground">{activityDay.dayLabel}</h2>
              <ActivityEntryList
                activityEntries={activityDay.entries}
                timeZone={calendarTimeZone}
              />
            </section>
          ))}
          {nextCursor === null ? null : (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={() => void handleLoadMore()}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityPage;
