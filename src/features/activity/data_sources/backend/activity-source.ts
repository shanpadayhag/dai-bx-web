import apiClient from '@/core/api/api-client';
import type { ActivityPageRecord } from '@/features/activity/entities/activity-entry-record';

type ActivityPageQuery = {
  since?: Date;
  cursor?: string;
  limit?: number;
};

const backendActivitySource = {
  listPage: (pageQuery: ActivityPageQuery) => {
    const pageSearch = new URLSearchParams();
    if (pageQuery.since !== undefined) pageSearch.set('since', pageQuery.since.toISOString());
    if (pageQuery.cursor !== undefined) pageSearch.set('cursor', pageQuery.cursor);
    if (pageQuery.limit !== undefined) pageSearch.set('limit', String(pageQuery.limit));
    const searchText = pageSearch.toString();
    return apiClient.get<ActivityPageRecord>(
      searchText === '' ? '/activity' : `/activity?${searchText}`,
    );
  },
};

export type { ActivityPageQuery };
export default backendActivitySource;
