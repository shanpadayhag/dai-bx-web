import { expect, test } from 'vitest';
import AppError from '@/core/app-error';
import changeTrackedTimes from '@/features/calendar/actions/change-tracked-times';
import startBackendServer from '@/test-support/backend-server';

startBackendServer();

const at = (hour: number, minute = 0) => new Date(2026, 10, 5, hour, minute);

test('refuses an end before the start or after now without a request', async () => {
  for (const refusedTimes of [
    { startsAt: at(10), endsAt: at(9) },
    { startsAt: at(10), endsAt: at(10) },
    { startsAt: at(10), endsAt: at(19) },
  ]) {
    await expect(
      changeTrackedTimes({
        eventId: 'event-1',
        ...refusedTimes,
        inputZone: 'America/Los_Angeles',
        now: at(18),
      }),
    ).rejects.toBeInstanceOf(AppError);
  }
});
