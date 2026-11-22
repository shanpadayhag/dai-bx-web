import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import findSearchResults from '@/features/search/actions/find-search-results';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const recordSearches = () => {
  const requestedSearches: string[] = [];
  backendServer.use(
    http.get('/backend/search', ({ request }) => {
      requestedSearches.push(new URL(request.url).search);
      return HttpResponse.json({ tasks: { items: [], hasMore: false } });
    }),
  );
  return requestedSearches;
};

test('sends nothing until two characters are typed', async () => {
  const requestedSearches = recordSearches();

  await expect(findSearchResults({ query: ' p ', expandedKind: null })).resolves.toEqual([]);

  expect(requestedSearches).toEqual([]);
});

test('asks for five of every kind, or fifty of one shown in full', async () => {
  const requestedSearches = recordSearches();

  await findSearchResults({ query: '  plan ', expandedKind: null });
  await findSearchResults({ query: 'plan', expandedKind: 'cards' });

  expect(requestedSearches).toEqual(['?q=plan&kind=all&limit=5', '?q=plan&kind=cards&limit=50']);
});

test('cuts a query longer than the API takes', async () => {
  const requestedSearches = recordSearches();

  await findSearchResults({ query: 'é'.repeat(250), expandedKind: null });

  const sentQuery = new URLSearchParams(requestedSearches[0]).get('q') ?? '';
  expect([...sentQuery]).toHaveLength(200);
});
