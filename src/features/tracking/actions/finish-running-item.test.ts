import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import AppError from '@/core/app-error';
import finishRunningItem, {
  resolveFinishEnd,
} from '@/features/tracking/actions/finish-running-item';
import type RunningItem from '@/features/tracking/entities/running-item';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const runningTask: RunningItem = {
  id: 'event-1',
  title: 'Write the changelog',
  sourceKind: 'task',
  sourceId: 'task-1',
  sourceName: 'Today',
  startedAt: new Date(2026, 10, 5, 16),
  lastAnsweredAt: new Date(2026, 10, 5, 16, 30),
  estimateMinutes: 30,
};

const now = new Date(2026, 10, 5, 17, 10);

test('each end choice picks its moment', () => {
  const baseParams = { runningItem: runningTask, customEndsAt: new Date(2026, 10, 5, 16, 50), now };

  expect(resolveFinishEnd({ ...baseParams, endChoice: 'now' })).toEqual(now);
  expect(resolveFinishEnd({ ...baseParams, endChoice: 'last-check-in' })).toEqual(
    new Date(2026, 10, 5, 16, 30),
  );
  expect(resolveFinishEnd({ ...baseParams, endChoice: 'custom' })).toEqual(
    new Date(2026, 10, 5, 16, 50),
  );
});

test('a set end must sit between the start and now', () => {
  const refusedTitle = (customEndsAt: Date) => {
    try {
      resolveFinishEnd({ runningItem: runningTask, endChoice: 'custom', customEndsAt, now });
      return null;
    } catch (finishError) {
      return finishError instanceof AppError ? finishError.title : null;
    }
  };

  expect(refusedTitle(new Date(Number.NaN))).toBe('Pick the End');
  expect(refusedTitle(new Date(2026, 10, 5, 16))).toBe('Check the End');
  expect(refusedTitle(new Date(2026, 10, 5, 17, 30))).toBe('Check the End');
});

test('a card never sends mark done', async () => {
  let sentBody: unknown = null;
  backendServer.use(
    http.post('/backend/tracking/:eventId/finish', async ({ request }) => {
      sentBody = await request.json();
      return HttpResponse.json({ event: {} });
    }),
  );

  await finishRunningItem({
    runningItem: { ...runningTask, sourceKind: 'card' },
    endChoice: 'now',
    customEndsAt: new Date(Number.NaN),
    markDone: true,
    now,
  });

  expect(sentBody).toEqual({ endsAt: now.toISOString(), markDone: false });
});
