import backendActivitySource, {
  type ActivityPageQuery,
} from '@/features/activity/data_sources/backend/activity-source';
import ActivityEntry, {
  activityEntryFromRecord,
} from '@/features/activity/entities/activity-entry';

type ActivityPage = {
  entries: ActivityEntry[];
  nextCursor: string | null;
};

const findActivity = async (pageQuery: ActivityPageQuery): Promise<ActivityPage> => {
  const pageRecord = await backendActivitySource.listPage(pageQuery);
  return {
    entries: pageRecord.entries.map(activityEntryFromRecord),
    nextCursor: pageRecord.nextCursor,
  };
};

export type { ActivityPage };
export default findActivity;
