import { http, HttpResponse, type JsonBodyType } from 'msw';
import { expect, test } from 'vitest';
import backendCardSource from '@/features/board/data_sources/backend/card-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type CardDetailRecord from '@/features/board/entities/card-detail-record';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const boardRecord: BoardRecord = {
  board: { id: 'b1', name: 'Personal' },
  lists: [],
  cards: [],
  properties: [],
};

test('sends each card write to its route with its body', async () => {
  const receivedRequests: { method: string; path: string; body: unknown }[] = [];
  const recordRequest = async ({ request }: { request: Request }) => {
    receivedRequests.push({
      method: request.method,
      path: new URL(request.url).pathname,
      body: await request.json().catch(() => undefined),
    });
    return HttpResponse.json(boardRecord);
  };
  backendServer.use(
    http.post('/backend/lists/l1/cards', recordRequest),
    http.patch('/backend/cards/c1', recordRequest),
    http.post('/backend/cards/c1/move', recordRequest),
    http.put('/backend/cards/c1/values/hours', recordRequest),
    http.delete('/backend/cards/c1/values/hours', recordRequest),
    http.delete('/backend/cards/c1', recordRequest),
  );

  await backendCardSource.create('l1', 'Plan the week');
  await backendCardSource.update('c1', { dueDate: '2026-11-05', dueTime: null });
  await backendCardSource.move('c1', { listId: 'l2', position: 0 });
  await backendCardSource.setValue('c1', 'hours', { number: '2.50' });
  await backendCardSource.clearValue('c1', 'hours');
  await backendCardSource.delete('c1');

  expect(receivedRequests).toEqual([
    { method: 'POST', path: '/backend/lists/l1/cards', body: { title: 'Plan the week' } },
    { method: 'PATCH', path: '/backend/cards/c1', body: { dueDate: '2026-11-05', dueTime: null } },
    { method: 'POST', path: '/backend/cards/c1/move', body: { listId: 'l2', position: 0 } },
    { method: 'PUT', path: '/backend/cards/c1/values/hours', body: { number: '2.50' } },
    { method: 'DELETE', path: '/backend/cards/c1/values/hours', body: {} },
    { method: 'DELETE', path: '/backend/cards/c1', body: {} },
  ]);
});

test("reads a card's detail", async () => {
  const cardDetailRecord: CardDetailRecord = {
    card: {
      id: 'c1',
      listId: 'l1',
      position: 0,
      title: 'Plan the week',
      dueDate: null,
      dueTime: null,
      values: [],
      linkedTaskCount: 0,
      doneLinkedTaskCount: 0,
      nextMove: null,
    },
    notes: '## Outcome\n',
    linkedTasks: [],
    trackedEventCount: 0,
    schedules: [],
    triggers: { started: null, finished: null },
    archived: null,
  };
  backendServer.use(http.get('/backend/cards/c1', () => HttpResponse.json(cardDetailRecord)));

  await expect(backendCardSource.find('c1')).resolves.toEqual(cardDetailRecord);
});

test('sends the workflow writes and reads to their routes', async () => {
  const receivedRequests: { method: string; path: string; body: unknown }[] = [];
  const recordRequest =
    (answer: JsonBodyType) =>
    async ({ request }: { request: Request }) => {
      const requestUrl = new URL(request.url);
      receivedRequests.push({
        method: request.method,
        path: `${requestUrl.pathname}${requestUrl.search}`,
        body: await request.json().catch(() => undefined),
      });
      return HttpResponse.json(answer);
    };
  const triggers = { started: { listId: 'l2', listName: 'Doing' }, finished: null };
  backendServer.use(
    http.put('/backend/cards/c1/triggers', recordRequest({ triggers })),
    http.get('/backend/cards/c1/history', recordRequest({ moves: [], hasMore: false })),
    http.post('/backend/cards/c1/archive', recordRequest({ status: 'archived' })),
    http.post('/backend/cards/c1/restore', recordRequest(boardRecord)),
    http.get('/backend/boards/b1/archived-cards', recordRequest({ cards: [], hasMore: false })),
  );

  await expect(
    backendCardSource.saveTriggers('c1', { startedListId: 'l2', finishedListId: null }),
  ).resolves.toEqual({ triggers });
  await backendCardSource.findHistory('c1', null);
  await backendCardSource.findHistory('c1', 'm9');
  await backendCardSource.archive('c1');
  await expect(backendCardSource.restore('c1')).resolves.toEqual(boardRecord);
  await backendCardSource.listArchived('b1', null);
  await backendCardSource.listArchived('b1', 'c7');

  expect(receivedRequests).toEqual([
    {
      method: 'PUT',
      path: '/backend/cards/c1/triggers',
      body: { startedListId: 'l2', finishedListId: null },
    },
    { method: 'GET', path: '/backend/cards/c1/history', body: undefined },
    { method: 'GET', path: '/backend/cards/c1/history?before=m9', body: undefined },
    { method: 'POST', path: '/backend/cards/c1/archive', body: {} },
    { method: 'POST', path: '/backend/cards/c1/restore', body: {} },
    { method: 'GET', path: '/backend/boards/b1/archived-cards', body: undefined },
    { method: 'GET', path: '/backend/boards/b1/archived-cards?before=c7', body: undefined },
  ]);
});
