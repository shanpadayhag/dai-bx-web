import ActivityEntry from '@/features/today/entities/activity-entry';

type ActivityFeedProps = {
  activityEntries: ActivityEntry[];
};

const ActivityFeed = ({ activityEntries }: ActivityFeedProps) => (
  <section className="grid gap-3 rounded-2xl border border-border bg-background p-5 shadow-soft">
    <h2 className="text-[13px] font-semibold text-foreground">Activity</h2>
    <ul className="grid gap-3">
      {activityEntries.map((activityEntry) => (
        <li key={activityEntry.id} className="grid grid-cols-[44px_1fr] gap-3">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {activityEntry.timeLabel}
          </span>
          <span className="grid gap-0.5">
            <span className="text-[13px] font-medium text-foreground">{activityEntry.summary}</span>
            <span className="text-xs text-muted-foreground">{activityEntry.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  </section>
);

export default ActivityFeed;
