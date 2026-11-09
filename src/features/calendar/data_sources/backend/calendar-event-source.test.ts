import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import backendCalendarEventSource from '@/features/calendar/data_sources/backend/calendar-event-source';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import type { CalendarRangeRecord } from '@/features/calendar/entities/calendar-event-record';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const plannedRecord: CalendarEventRecord = {
  id: 'event-1',
  kind: 'planned',
  title: 'Plan the week',
  categoryId: null,
  startsAt: '2026-11-05T16:00:00.000Z',
  endsAt: '2026-11-05T17:00:00.000Z',
  finishedAt: null,
  lastAnsweredAt: null,
  source: null,
  timeZone: null,
  series: null,
};

const runOccurrence: CalendarEventRecord = {
  ...plannedRecord,
  id: 'series-1:2026-11-09T22:00:00.000Z',
  title: 'Morning run',
  startsAt: '2026-11-09T22:00:00.000Z',
  endsAt: '2026-11-09T23:00:00.000Z',
  timeZone: 'Asia/Manila',
  series: {
    id: 'series-1',
    originalStart: '2026-11-09T22:00:00.000Z',
    repeat: { frequency: 'weekly', interval: 1, weekdays: ['tue'], ends: { never: true } },
  },
};

type ReceivedRequest = { method: string; path: string; search: string; body: unknown };

const recordRequests = (answer: (request: Request) => Response) => {
  const receivedRequests: ReceivedRequest[] = [];
  const recordRequest = async ({ request }: { request: Request }) => {
    const requestUrl = new URL(request.url);
    receivedRequests.push({
      method: request.method,
      path: decodeURIComponent(requestUrl.pathname),
      search: requestUrl.search,
      body: await request.json().catch(() => undefined),
    });
    return answer(request);
  };
  return { receivedRequests, recordRequest };
};

test('reads the events and moves of a range by its start, days and zone', async () => {
  const calendarRange: CalendarRangeRecord = {
    events: [plannedRecord, runOccurrence],
    moves: [
      {
        scheduleId: 'schedule-1',
        cardId: 'card-1',
        cardTitle: 'Weekly review',
        boardId: 'board-1',
        listName: 'To Do',
        at: '2026-11-09T10:00:00.000Z',
      },
    ],
  };
  const { receivedRequests, recordRequest } = recordRequests(() =>
    HttpResponse.json(calendarRange),
  );
  backendServer.use(http.get('/backend/calendar/events', recordRequest));

  expect(
    await backendCalendarEventSource.listRange({
      start: '2026-11-09',
      days: 7,
      timeZone: 'Asia/Manila',
    }),
  ).toEqual(calendarRange);
  expect(Object.fromEntries(new URLSearchParams(receivedRequests[0]?.search))).toEqual({
    start: '2026-11-09',
    days: '7',
    timeZone: 'Asia/Manila',
  });
});

test('sends each event write as wall-clock times with the zone they were entered in', async () => {
  const { receivedRequests, recordRequest } = recordRequests((request) =>
    request.method === 'DELETE'
      ? HttpResponse.json({ status: 'deleted' })
      : HttpResponse.json(plannedRecord),
  );
  backendServer.use(
    http.post('/backend/calendar/events', recordRequest),
    http.patch('/backend/calendar/events/event-1', recordRequest),
    http.delete('/backend/calendar/events/event-1', recordRequest),
  );

  await backendCalendarEventSource.createPlanned({
    title: 'Morning run',
    categoryId: 'focus',
    start: '2026-11-10T06:00',
    end: '2026-11-10T07:00',
    inputZone: 'Asia/Manila',
    timeZone: 'Asia/Manila',
    repeat: { frequency: 'weekly', interval: 1, weekdays: ['tue'], ends: { never: true } },
  });
  await backendCalendarEventSource.update('event-1', {
    categoryId: null,
    end: '2026-11-06T01:30',
    inputZone: 'Asia/Manila',
  });
  await backendCalendarEventSource.delete('event-1');

  expect(receivedRequests.map(({ method, path, body }) => ({ method, path, body }))).toEqual([
    {
      method: 'POST',
      path: '/backend/calendar/events',
      body: {
        title: 'Morning run',
        categoryId: 'focus',
        start: '2026-11-10T06:00',
        end: '2026-11-10T07:00',
        inputZone: 'Asia/Manila',
        timeZone: 'Asia/Manila',
        repeat: { frequency: 'weekly', interval: 1, weekdays: ['tue'], ends: { never: true } },
      },
    },
    {
      method: 'PATCH',
      path: '/backend/calendar/events/event-1',
      body: { categoryId: null, end: '2026-11-06T01:30', inputZone: 'Asia/Manila' },
    },
    { method: 'DELETE', path: '/backend/calendar/events/event-1', body: {} },
  ]);
});

test('changes and deletes a series occurrence with its scope', async () => {
  const { receivedRequests, recordRequest } = recordRequests((request) =>
    request.method === 'DELETE'
      ? HttpResponse.json({ status: 'deleted' })
      : HttpResponse.json(runOccurrence),
  );
  const occurrencePath = '/backend/calendar/series/series-1/occurrences/:originalStart';
  backendServer.use(
    http.patch(occurrencePath, recordRequest),
    http.delete(occurrencePath, recordRequest),
  );

  expect(
    await backendCalendarEventSource.changeOccurrence(
      { seriesId: 'series-1', originalStart: '2026-11-09T22:00:00.000Z' },
      'following',
      { start: '2026-11-10T06:30', end: '2026-11-10T07:30', inputZone: 'Asia/Manila' },
    ),
  ).toEqual(runOccurrence);
  await backendCalendarEventSource.deleteOccurrence(
    { seriesId: 'series-1', originalStart: '2026-11-09T22:00:00.000Z' },
    'this',
  );

  expect(receivedRequests).toEqual([
    {
      method: 'PATCH',
      path: '/backend/calendar/series/series-1/occurrences/2026-11-09T22:00:00.000Z',
      search: '',
      body: {
        scope: 'following',
        start: '2026-11-10T06:30',
        end: '2026-11-10T07:30',
        inputZone: 'Asia/Manila',
      },
    },
    {
      method: 'DELETE',
      path: '/backend/calendar/series/series-1/occurrences/2026-11-09T22:00:00.000Z',
      search: '?scope=this',
      body: {},
    },
  ]);
});
