import apiClient from '@/core/api/api-client';
import type { SearchResultsRecord } from '@/features/search/entities/search-result-record';

type SearchRequest = {
  query: string;
  kind: 'all' | 'tasks' | 'groups' | 'cards' | 'events';
  limit: number;
};

const backendSearchSource = {
  find: (searchRequest: SearchRequest) => {
    const searchParameters = new URLSearchParams({
      q: searchRequest.query,
      kind: searchRequest.kind,
      limit: String(searchRequest.limit),
    });
    return apiClient.get<SearchResultsRecord>(`/search?${searchParameters.toString()}`);
  },
};

export type { SearchRequest };
export default backendSearchSource;
