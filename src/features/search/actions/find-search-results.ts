import backendSearchSource from '@/features/search/data_sources/backend/search-source';
import {
  searchSectionsFromRecord,
  type SearchKind,
  type SearchSection,
} from '@/features/search/entities/search-result';

const SEARCH_QUERY_LENGTH_MIN = 2;
const SEARCH_QUERY_LENGTH_MAX = 200;
const SECTION_RESULT_COUNT = 5;
const SHOW_ALL_RESULT_COUNT = 50;

type FindSearchResultsParams = {
  query: string;
  expandedKind: SearchKind | null;
};

const isSearchable = (query: string): boolean =>
  [...query.trim()].length >= SEARCH_QUERY_LENGTH_MIN;

const findSearchResults = async ({
  query,
  expandedKind,
}: FindSearchResultsParams): Promise<SearchSection[]> => {
  const trimmedQuery = [...query.trim()].slice(0, SEARCH_QUERY_LENGTH_MAX).join('');
  if (!isSearchable(trimmedQuery)) return [];
  const resultsRecord = await backendSearchSource.find({
    query: trimmedQuery,
    kind: expandedKind ?? 'all',
    limit: expandedKind === null ? SECTION_RESULT_COUNT : SHOW_ALL_RESULT_COUNT,
  });
  return searchSectionsFromRecord(resultsRecord);
};

export { isSearchable };
export default findSearchResults;
