import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import backendTimeTrackingSettingsSource from '@/features/tracking/data_sources/backend/time-tracking-settings-source';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const timeTrackingSettings: TimeTrackingSettings = {
  checkInsEnabled: true,
  checkInIntervalMinutes: 30,
  firstCheckInMinutes: 30,
  workingHoursStart: '16:00',
  workingHoursEnd: '02:00',
  trackedCategoryId: null,
};

test('reads and changes the time-tracking settings', async () => {
  let receivedChanges: unknown;
  backendServer.use(
    http.get('/backend/account/time-tracking', () => HttpResponse.json(timeTrackingSettings)),
    http.patch('/backend/account/time-tracking', async ({ request }) => {
      receivedChanges = await request.json();
      return HttpResponse.json({ ...timeTrackingSettings, trackedCategoryId: 'focus' });
    }),
  );

  expect(await backendTimeTrackingSettingsSource.find()).toEqual(timeTrackingSettings);
  expect(
    await backendTimeTrackingSettingsSource.update({ trackedCategoryId: 'focus' }),
  ).toMatchObject({ trackedCategoryId: 'focus' });
  expect(receivedChanges).toEqual({ trackedCategoryId: 'focus' });
});
