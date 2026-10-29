import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import backendTaskGroupSource from '@/features/tasks/data_sources/backend/task-group-source';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const todayGroup = { id: 'g1', name: 'Today', openTaskCount: 0, taskCount: 0 };

const captureBody = (
  requestMethod: 'post' | 'patch',
  requestPath: string,
  answerBody: Record<string, unknown> | unknown[],
) => {
  let receivedBody: unknown;
  backendServer.use(
    http[requestMethod](requestPath, async ({ request }) => {
      receivedBody = await request.json();
      return HttpResponse.json(answerBody);
    }),
  );
  return () => receivedBody;
};

test('lists groups from GET /task-groups', async () => {
  backendServer.use(http.get('/backend/task-groups', () => HttpResponse.json([todayGroup])));

  await expect(backendTaskGroupSource.findAll()).resolves.toEqual([todayGroup]);
});

test('creates a group with its name', async () => {
  const readBody = captureBody('post', '/backend/task-groups', todayGroup);

  await backendTaskGroupSource.create({ name: 'Today' });

  expect(readBody()).toEqual({ name: 'Today' });
});

test('renames a group with PATCH /task-groups/{id}', async () => {
  const readBody = captureBody('patch', '/backend/task-groups/g1', todayGroup);

  await backendTaskGroupSource.update('g1', { name: 'Monday' });

  expect(readBody()).toEqual({ name: 'Monday' });
});

test('deletes a group with DELETE /task-groups/{id}', async () => {
  let isDeleted = false;
  backendServer.use(
    http.delete('/backend/task-groups/g1', () => {
      isDeleted = true;
      return HttpResponse.json({ status: 'deleted' });
    }),
  );

  await backendTaskGroupSource.delete('g1');

  expect(isDeleted).toBe(true);
});

test('imports a group file with POST /task-groups/import', async () => {
  const importFile = { name: 'Today', tasks: [{ name: 'A', tasks: [] }] };
  const readBody = captureBody('post', '/backend/task-groups/import', {
    group: { id: 'g2', name: 'Today' },
    tasks: [],
    openCount: 0,
    doneCount: 0,
  });

  await backendTaskGroupSource.importFile(importFile);

  expect(readBody()).toEqual(importFile);
});
