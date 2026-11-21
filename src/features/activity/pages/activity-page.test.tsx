import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import type ActivityEntryRecord from '@/features/activity/entities/activity-entry-record';
import ActivityPage from '@/features/activity/pages/activity-page';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const tickRecord = (id: string, occurredAt: string, title: string): ActivityEntryRecord => ({
  id,
  occurredAt,
  title,
  contextName: 'DaiBX',
  taskId: 'task-1',
  cardId: null,
  boardId: null,
  kind: 'task_completed',
  details: { isSubtask: false },
});

test('shows an empty state when there is no activity', async () => {
  backendServer.use(
    http.get('/backend/activity', () => HttpResponse.json({ entries: [], nextCursor: null })),
  );

  render(<ActivityPage />);

  expect(await screen.findByRole('heading', { name: 'No activity yet' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
});

test('loads the next page with the cursor and appends it', async () => {
  const requestedCursors: (string | null)[] = [];
  backendServer.use(
    http.get('/backend/activity', ({ request }) => {
      const cursor = new URL(request.url).searchParams.get('cursor');
      requestedCursors.push(cursor);
      return HttpResponse.json(
        cursor === null
          ? {
              entries: [tickRecord('a', '2026-11-03T18:00:00.000Z', 'Write the changelog')],
              nextCursor: 'cursor-1',
            }
          : {
              entries: [tickRecord('b', '2026-11-02T18:00:00.000Z', 'Stretch')],
              nextCursor: null,
            },
      );
    }),
  );

  render(<ActivityPage />);
  await userEvent.click(await screen.findByRole('button', { name: 'Load more' }));

  expect(await screen.findByText('Stretch')).toBeVisible();
  expect(screen.getByText('Write the changelog')).toBeVisible();
  expect(requestedCursors).toEqual([null, 'cursor-1']);
  expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  expect(
    within(screen.getByRole('region', { name: 'Monday, November 2' })).getByText('Stretch'),
  ).toBeVisible();
});
