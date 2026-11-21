import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import findUpNext from '@/features/today/actions/find-up-next';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

test('reads up next and turns its times into dates', async () => {
  backendServer.use(
    http.get('/backend/today/up-next', () =>
      HttpResponse.json({
        tasks: [
          {
            taskId: 'task-1',
            name: 'Ship',
            groupId: 'group-1',
            groupName: 'DaiBX',
            estimateMinutes: 15,
            due: { date: '2026-11-22', time: null },
            priority: 'high',
            plannedEvent: {
              id: 'event-1',
              startsAt: '2026-11-21T10:00:00.000Z',
              endsAt: '2026-11-21T10:15:00.000Z',
            },
            missed: true,
          },
        ],
        refreshAt: '2026-11-21T16:00:00.000Z',
      }),
    ),
  );

  const upNext = await findUpNext();

  expect(upNext.refreshAt).toEqual(new Date('2026-11-21T16:00:00.000Z'));
  expect(upNext.tasks[0]).toMatchObject({
    taskId: 'task-1',
    isMissed: true,
    plannedBlock: {
      eventId: 'event-1',
      startsAt: new Date('2026-11-21T10:00:00.000Z'),
      endsAt: new Date('2026-11-21T10:15:00.000Z'),
    },
  });
});
