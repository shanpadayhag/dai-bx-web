import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import backendActivitySource from '@/features/activity/data_sources/backend/activity-source';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

test('sends since, cursor and limit only when given', async () => {
  const requestedSearches: string[] = [];
  backendServer.use(
    http.get('/backend/activity', ({ request }) => {
      requestedSearches.push(new URL(request.url).search);
      return HttpResponse.json({ entries: [], nextCursor: null });
    }),
  );

  await backendActivitySource.listPage({});
  await backendActivitySource.listPage({
    since: new Date('2026-11-21T16:00:00.000Z'),
    cursor: '1732000000000~entry-1',
    limit: 50,
  });

  expect(requestedSearches).toEqual([
    '',
    '?since=2026-11-21T16%3A00%3A00.000Z&cursor=1732000000000%7Eentry-1&limit=50',
  ]);
});
