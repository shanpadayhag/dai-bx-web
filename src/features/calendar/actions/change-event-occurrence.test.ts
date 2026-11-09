import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import AppError from '@/core/app-error';
import changeEventOccurrence from '@/features/calendar/actions/change-event-occurrence';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const occurrenceKey = { seriesId: 'series-1', originalStart: '2026-11-09T22:00:00.000Z' };

test('sends the scope with the changed fields as wall-clock times in the calendar zone', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.patch(
      '/backend/calendar/series/series-1/occurrences/:originalStart',
      async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({});
      },
    ),
  );

  await changeEventOccurrence({
    occurrenceKey,
    scope: 'following',
    inputZone: 'Asia/Manila',
    title: '  Long run ',
    times: {
      startsAt: new Date('2026-11-09T22:30:00Z'),
      endsAt: new Date('2026-11-09T23:30:00Z'),
    },
  });

  expect(receivedBody).toEqual({
    scope: 'following',
    title: 'Long run',
    start: '2026-11-10T06:30',
    end: '2026-11-10T07:30',
    inputZone: 'Asia/Manila',
  });
});

test('refuses a too-short occurrence without a request', async () => {
  await expect(
    changeEventOccurrence({
      occurrenceKey,
      scope: 'this',
      inputZone: 'Asia/Manila',
      times: {
        startsAt: new Date('2026-11-09T22:00:00Z'),
        endsAt: new Date('2026-11-09T22:05:00Z'),
      },
    }),
  ).rejects.toBeInstanceOf(AppError);
});
