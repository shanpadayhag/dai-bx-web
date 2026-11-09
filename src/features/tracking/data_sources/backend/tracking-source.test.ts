import { http, HttpResponse, type JsonBodyType } from 'msw';
import { expect, test } from 'vitest';
import backendTrackingSource from '@/features/tracking/data_sources/backend/tracking-source';
import type RunningItemRecord from '@/features/tracking/entities/running-item-record';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const runningItemRecord: RunningItemRecord = {
  id: 'event-1',
  kind: 'tracked',
  title: 'Write the changelog',
  categoryId: null,
  startsAt: '2026-11-05T16:00:00.000Z',
  endsAt: null,
  finishedAt: null,
  lastAnsweredAt: null,
  timeZone: null,
  series: null,
  source: { kind: 'task', id: 'task-1', groupId: 'group-1' },
  estimateMinutes: 45,
  sourceName: 'DaiBX',
};

test('reads the running list', async () => {
  backendServer.use(
    http.get('/backend/tracking/running', () => HttpResponse.json([runningItemRecord])),
  );

  expect(await backendTrackingSource.listRunning()).toEqual([runningItemRecord]);
});

test('sends starts, check-ins and finishes to their routes', async () => {
  const receivedRequests: { method: string; path: string; body: unknown }[] = [];
  const recordRequest =
    (answerBody: JsonBodyType, answerStatus = 200) =>
    async ({ request }: { request: Request }) => {
      receivedRequests.push({
        method: request.method,
        path: new URL(request.url).pathname,
        body: await request.json().catch(() => undefined),
      });
      return HttpResponse.json(answerBody, { status: answerStatus });
    };
  const finishedEvent = {
    ...runningItemRecord,
    endsAt: '2026-11-05T17:00:00.000Z',
    finishedAt: '2026-11-05T17:00:00.000Z',
  };
  backendServer.use(
    http.post('/backend/tasks/task-1/start', recordRequest(runningItemRecord, 201)),
    http.post('/backend/cards/card-1/start', recordRequest(runningItemRecord, 201)),
    http.post('/backend/tracking/event-1/check-in', recordRequest(runningItemRecord)),
    http.post('/backend/tracking/event-1/finish', recordRequest({ event: finishedEvent })),
  );

  await backendTrackingSource.startTask('task-1');
  await backendTrackingSource.startCard('card-1');
  await backendTrackingSource.checkIn('event-1');
  const finishedItem = await backendTrackingSource.finish('event-1', {
    endsAt: '2026-11-05T17:00:00.000Z',
    markDone: true,
  });

  expect(finishedItem).toEqual({ event: finishedEvent });
  expect(receivedRequests).toEqual([
    { method: 'POST', path: '/backend/tasks/task-1/start', body: {} },
    { method: 'POST', path: '/backend/cards/card-1/start', body: {} },
    { method: 'POST', path: '/backend/tracking/event-1/check-in', body: {} },
    {
      method: 'POST',
      path: '/backend/tracking/event-1/finish',
      body: { endsAt: '2026-11-05T17:00:00.000Z', markDone: true },
    },
  ]);
});
