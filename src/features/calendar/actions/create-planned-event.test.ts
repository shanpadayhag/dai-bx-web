import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import AppError from '@/core/app-error';
import createPlannedEvent from '@/features/calendar/actions/create-planned-event';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const at = (hour: number, minute = 0) => new Date(2026, 10, 5, hour, minute);

test('a title is trimmed and the times are sent as wall-clock times in the input zone', async () => {
  let receivedBody: unknown;
  backendServer.use(
    http.post('/backend/calendar/events', async ({ request }) => {
      receivedBody = await request.json();
      return HttpResponse.json({} as CalendarEventRecord, { status: 201 });
    }),
  );

  await createPlannedEvent({
    title: '  Gym  ',
    categoryId: null,
    startsAt: at(19),
    endsAt: at(20),
    inputZone: 'Asia/Manila',
  });

  expect(receivedBody).toEqual({
    title: 'Gym',
    categoryId: null,
    start: '2026-11-06T11:00',
    end: '2026-11-06T12:00',
    inputZone: 'Asia/Manila',
  });
});

test('refuses an empty title, a long title and a too-short event without a request', async () => {
  for (const refusedParams of [
    { title: '   ', startsAt: at(19), endsAt: at(20) },
    { title: 'x'.repeat(201), startsAt: at(19), endsAt: at(20) },
    { title: 'Gym', startsAt: at(19), endsAt: at(19, 10) },
    { title: 'Gym', startsAt: at(19), endsAt: new Date(Number.NaN) },
  ]) {
    await expect(
      createPlannedEvent({ ...refusedParams, categoryId: null, inputZone: 'Asia/Manila' }),
    ).rejects.toBeInstanceOf(AppError);
  }
});
