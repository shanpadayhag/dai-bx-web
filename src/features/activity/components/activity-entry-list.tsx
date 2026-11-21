import Link from 'next/link';
import { formatClockInZone } from '@/core/time-zone';
import ActivityEntry, {
  activityLink,
  describeActivity,
} from '@/features/activity/entities/activity-entry';

type ActivityEntryListProps = {
  activityEntries: readonly ActivityEntry[];
  timeZone: string;
};

const ActivityEntryList = ({ activityEntries, timeZone }: ActivityEntryListProps) => (
  <ul className="grid gap-3">
    {activityEntries.map((activityEntry) => {
      const activityDescription = describeActivity(activityEntry, timeZone);
      const entryLink = activityLink(activityEntry);
      return (
        <li key={activityEntry.id} className="grid grid-cols-[44px_1fr] gap-3">
          <time
            dateTime={activityEntry.occurredAt.toISOString()}
            className="pt-px font-mono text-xs text-muted-foreground tabular-nums"
          >
            {formatClockInZone(activityEntry.occurredAt, timeZone)}
          </time>
          <span className="grid min-w-0 gap-0.5">
            <span className="text-[13px] text-foreground">
              {activityDescription.action}{' '}
              {activityDescription.title === null ? null : entryLink === null ? (
                <span className="font-medium">{activityDescription.title}</span>
              ) : (
                <Link
                  href={entryLink}
                  className="font-medium underline-offset-2 hover:text-primary hover:underline"
                >
                  {activityDescription.title}
                </Link>
              )}
            </span>
            {activityDescription.detail === '' ? null : (
              <span className="text-xs text-muted-foreground">{activityDescription.detail}</span>
            )}
          </span>
        </li>
      );
    })}
  </ul>
);

export default ActivityEntryList;
