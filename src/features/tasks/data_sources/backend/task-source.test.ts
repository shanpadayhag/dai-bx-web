import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import backendTaskSource from '@/features/tasks/data_sources/backend/task-source';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const groupTasks = {
  group: { id: 'g1', name: 'Today' },
  tasks: [
    { id: 't1', parentId: null, position: 0, name: 'A', isDone: false, estimateMinutes: null },
  ],
  openCount: 1,
  doneCount: 0,
};

const captureRequest = (
  requestMethod: 'post' | 'patch' | 'delete',
  requestPath: string,
  answerBody: Record<string, unknown> | unknown[] = groupTasks,
) => {
  const receivedRequest: { body?: unknown; isReceived: boolean } = { isReceived: false };
  backendServer.use(
    http[requestMethod](requestPath, async ({ request }) => {
      receivedRequest.isReceived = true;
      receivedRequest.body = await request.json().catch(() => undefined);
      return HttpResponse.json(answerBody);
    }),
  );
  return receivedRequest;
};

test("reads a group's tasks from GET /task-groups/{id}/tasks", async () => {
  backendServer.use(http.get('/backend/task-groups/g1/tasks', () => HttpResponse.json(groupTasks)));

  await expect(backendTaskSource.findGroupTasks('g1')).resolves.toEqual(groupTasks);
});

test('adds a task with its name and parent', async () => {
  const receivedRequest = captureRequest('post', '/backend/task-groups/g1/tasks');

  await backendTaskSource.add('g1', { name: 'B', parentId: 't1' });

  expect(receivedRequest.body).toEqual({ name: 'B', parentId: 't1' });
});

test('updates a task with only the fields sent, null clearing the estimate', async () => {
  const receivedRequest = captureRequest('patch', '/backend/tasks/t1');

  await backendTaskSource.update('t1', { estimateMinutes: null });

  expect(receivedRequest.body).toEqual({ estimateMinutes: null });
});

test('completes, reopens and deletes a task on their own routes', async () => {
  const completeRequest = captureRequest('post', '/backend/tasks/t1/complete');
  const reopenRequest = captureRequest('post', '/backend/tasks/t1/reopen');
  const deleteRequest = captureRequest('delete', '/backend/tasks/t1');

  await backendTaskSource.complete('t1');
  await backendTaskSource.reopen('t1');
  await backendTaskSource.delete('t1');

  expect(
    [completeRequest, reopenRequest, deleteRequest].map((request) => request.isReceived),
  ).toEqual([true, true, true]);
});

test('moves a task with its target group, parent and position', async () => {
  const receivedRequest = captureRequest('post', '/backend/tasks/t1/move', {
    ...groupTasks,
    affectedGroups: [],
  });

  const movedGroupTasks = await backendTaskSource.move('t1', {
    groupId: 'g2',
    parentId: null,
    position: 3,
  });

  expect(receivedRequest.body).toEqual({ groupId: 'g2', parentId: null, position: 3 });
  expect(movedGroupTasks.affectedGroups).toEqual([]);
});
