import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import backendCalendarEventSource from '@/features/calendar/data_sources/backend/calendar-event-source';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
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
};

test('reads the events of a range as UTC times', async () => {
  let receivedSearch = '';
  backendServer.use(
    http.get('/backend/calendar/events', ({ request }) => {
      receivedSearch = new URL(request.url).search;
      return HttpResponse.json([plannedRecord]);
    }),
  );

  const eventRecords = await backendCalendarEventSource.listRange({
    from: new Date('2026-11-02T08:00:00.000Z'),
    to: new Date('2026-11-09T08:00:00.000Z'),
  });

  expect(eventRecords).toEqual([plannedRecord]);
  expect(new URLSearchParams(receivedSearch).get('from')).toBe('2026-11-02T08:00:00.000Z');
  expect(new URLSearchParams(receivedSearch).get('to')).toBe('2026-11-09T08:00:00.000Z');
});

test('sends each event write to its route with its body', async () => {
  const receivedRequests: { method: string; path: string; body: unknown }[] = [];
  const recordRequest = async ({ request }: { request: Request }) => {
    receivedRequests.push({
      method: request.method,
      path: new URL(request.url).pathname,
      body: await request.json().catch(() => undefined),
    });
    return request.method === 'DELETE'
      ? HttpResponse.json({ status: 'deleted' })
      : HttpResponse.json(plannedRecord);
  };
  backendServer.use(
    http.post('/backend/calendar/events', recordRequest),
    http.patch('/backend/calendar/events/event-1', recordRequest),
    http.delete('/backend/calendar/events/event-1', recordRequest),
  );

  await backendCalendarEventSource.createPlanned({
    title: 'Plan the week',
    categoryId: 'focus',
    startsAt: '2026-11-05T16:00:00.000Z',
    endsAt: '2026-11-05T17:00:00.000Z',
  });
  await backendCalendarEventSource.update('event-1', {
    categoryId: null,
    endsAt: '2026-11-05T17:30:00.000Z',
  });
  await backendCalendarEventSource.delete('event-1');

  expect(receivedRequests).toEqual([
    {
      method: 'POST',
      path: '/backend/calendar/events',
      body: {
        title: 'Plan the week',
        categoryId: 'focus',
        startsAt: '2026-11-05T16:00:00.000Z',
        endsAt: '2026-11-05T17:00:00.000Z',
      },
    },
    {
      method: 'PATCH',
      path: '/backend/calendar/events/event-1',
      body: { categoryId: null, endsAt: '2026-11-05T17:30:00.000Z' },
    },
    { method: 'DELETE', path: '/backend/calendar/events/event-1', body: {} },
  ]);
});
