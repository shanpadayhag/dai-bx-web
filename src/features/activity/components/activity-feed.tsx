import Link from 'next/link';
import ActivityEntryList from '@/features/activity/components/activity-entry-list';
import type ActivityEntry from '@/features/activity/entities/activity-entry';

type ActivityFeedProps = {
  activityEntries: readonly ActivityEntry[] | null;
  timeZone: string;
};

const ActivityFeed = ({ activityEntries, timeZone }: ActivityFeedProps) => (
  <section
    aria-labelledby="today-activity-title"
    className="grid gap-3 rounded-2xl border border-border bg-background p-5 shadow-soft"
  >
    <div className="flex items-center justify-between">
      <h2 id="today-activity-title" className="text-[13px] font-semibold text-foreground">
        Activity
      </h2>
      <Link href="/activity" className="text-xs text-primary hover:underline">
        See all
      </Link>
    </div>
    {activityEntries === null ? (
      <p className="text-[13px] text-muted-foreground">Loading…</p>
    ) : activityEntries.length === 0 ? (
      <p className="text-[13px] text-muted-foreground">
        Nothing yet today. Starts, finishes, ticks and card moves show up here.
      </p>
    ) : (
      <ActivityEntryList activityEntries={activityEntries} timeZone={timeZone} />
    )}
  </section>
);

export default ActivityFeed;
