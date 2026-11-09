import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import backendCardScheduleSource from '@/features/board/data_sources/backend/card-schedule-source';
import type CardScheduleRecord from '@/features/board/entities/card-schedule-record';
import type { ScheduleRunRecord } from '@/features/board/entities/card-schedule-record';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const weeklySchedule: CardScheduleRecord = {
  id: 's1',
  kind: 'repeating',
  targetListId: 'l1',
  targetListName: 'To Do',
  start: '2026-11-09T18:00',
  startsAt: '2026-11-09T10:00:00.000Z',
  timeZone: 'Asia/Manila',
  repeat: { frequency: 'weekly', interval: 1, weekdays: ['mon'], ends: { never: true } },
  block: { minutes: 60, categoryId: null },
  paused: false,
  nextRunAt: '2026-11-09T10:00:00.000Z',
};

const scheduleRuns: ScheduleRunRecord[] = [
  { id: 'r1', ranAt: '2026-11-02T10:00:31.000Z', how: 'onTime', moved: true, trackedMinutes: 45 },
];

test('sends each schedule write to its route with its body', async () => {
  const receivedRequests: { method: string; path: string; body: unknown }[] = [];
  const recordRequest = async ({ request }: { request: Request }) => {
    const requestPath = new URL(request.url).pathname;
    receivedRequests.push({
      method: request.method,
      path: requestPath,
      body: await request.json().catch(() => undefined),
    });
    return /\/(pause|resume|run-now)$/.test(requestPath)
      ? HttpResponse.json(weeklySchedule)
      : HttpResponse.json({ schedules: [weeklySchedule] });
  };
  backendServer.use(
    http.post('/backend/cards/c1/schedules', recordRequest),
    http.patch('/backend/schedules/s1', recordRequest),
    http.post('/backend/schedules/s1/pause', recordRequest),
    http.post('/backend/schedules/s1/resume', recordRequest),
    http.post('/backend/schedules/s1/run-now', recordRequest),
    http.delete('/backend/schedules/s1', recordRequest),
  );
  const scheduleWrite = {
    kind: 'repeating' as const,
    targetListId: 'l1',
    start: '2026-11-09T18:00',
    inputZone: 'Asia/Manila',
    timeZone: 'Asia/Manila',
    repeat: weeklySchedule.repeat ?? undefined,
    block: { minutes: 60, categoryId: null },
  };

  expect(await backendCardScheduleSource.create('c1', scheduleWrite)).toEqual({
    schedules: [weeklySchedule],
  });
  await backendCardScheduleSource.update('s1', { ...scheduleWrite, block: null });
  expect(await backendCardScheduleSource.pause('s1')).toEqual(weeklySchedule);
  await backendCardScheduleSource.resume('s1');
  await backendCardScheduleSource.runNow('s1');
  expect(await backendCardScheduleSource.delete('s1')).toEqual({ schedules: [weeklySchedule] });

  expect(receivedRequests).toEqual([
    { method: 'POST', path: '/backend/cards/c1/schedules', body: scheduleWrite },
    {
      method: 'PATCH',
      path: '/backend/schedules/s1',
      body: { ...scheduleWrite, block: null },
    },
    { method: 'POST', path: '/backend/schedules/s1/pause', body: {} },
    { method: 'POST', path: '/backend/schedules/s1/resume', body: {} },
    { method: 'POST', path: '/backend/schedules/s1/run-now', body: {} },
    { method: 'DELETE', path: '/backend/schedules/s1', body: {} },
  ]);
});

test('reads a page of runs, older than a given run when asked', async () => {
  const receivedSearches: string[] = [];
  backendServer.use(
    http.get('/backend/schedules/s1/runs', ({ request }) => {
      receivedSearches.push(new URL(request.url).search);
      return HttpResponse.json(scheduleRuns);
    }),
  );

  expect(await backendCardScheduleSource.listRuns('s1')).toEqual(scheduleRuns);
  await backendCardScheduleSource.listRuns('s1', {
    before: '2026-11-02T10:00:31.000Z',
    limit: 20,
  });

  expect(receivedSearches).toEqual(['', '?before=2026-11-02T10%3A00%3A31.000Z&limit=20']);
});
