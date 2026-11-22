import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import backendSearchSource from '@/features/search/data_sources/backend/search-source';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

test('sends the query, kind and limit and reads the sections', async () => {
  const requestedSearches: string[] = [];
  backendServer.use(
    http.get('/backend/search', ({ request }) => {
      requestedSearches.push(new URL(request.url).search);
      return HttpResponse.json({ tasks: { items: [], hasMore: false } });
    }),
  );

  const searchResults = await backendSearchSource.find({
    query: 'rev plan & co',
    kind: 'tasks',
    limit: 50,
  });

  expect(requestedSearches).toEqual(['?q=rev+plan+%26+co&kind=tasks&limit=50']);
  expect(searchResults).toEqual({ tasks: { items: [], hasMore: false } });
});
