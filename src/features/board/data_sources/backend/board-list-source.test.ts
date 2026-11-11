import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import backendBoardListSource from '@/features/board/data_sources/backend/board-list-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type ListExport from '@/features/board/entities/list-export';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const boardRecord: BoardRecord = {
  board: { id: 'b1', name: 'Personal' },
  lists: [{ id: 'l1', name: 'Backlog', position: 0, archiveAfter: null }],
  cards: [],
  properties: [],
};

test('sends each list write to its route with its body', async () => {
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
    http.post('/backend/boards/b1/lists', recordRequest),
    http.patch('/backend/lists/l1', recordRequest),
    http.post('/backend/lists/l1/move', recordRequest),
    http.delete('/backend/lists/l1', recordRequest),
  );

  await backendBoardListSource.create('b1', 'Backlog');
  await backendBoardListSource.rename('l1', 'Ideas');
  await backendBoardListSource.setArchiveAfter('l1', '1w');
  await backendBoardListSource.setArchiveAfter('l1', null);
  await backendBoardListSource.move('l1', 2);
  await expect(backendBoardListSource.delete('l1')).resolves.toEqual(boardRecord);

  expect(receivedRequests).toEqual([
    { method: 'POST', path: '/backend/boards/b1/lists', body: { name: 'Backlog' } },
    { method: 'PATCH', path: '/backend/lists/l1', body: { name: 'Ideas' } },
    { method: 'PATCH', path: '/backend/lists/l1', body: { archiveAfter: '1w' } },
    { method: 'PATCH', path: '/backend/lists/l1', body: { archiveAfter: null } },
    { method: 'POST', path: '/backend/lists/l1/move', body: { position: 2 } },
    { method: 'DELETE', path: '/backend/lists/l1', body: {} },
  ]);
});

test("reads a list's export", async () => {
  const listExport: ListExport = {
    board: { name: 'Personal' },
    list: { name: 'Backlog' },
    cards: [],
  };
  backendServer.use(http.get('/backend/lists/l1/export', () => HttpResponse.json(listExport)));

  await expect(backendBoardListSource.export('l1')).resolves.toEqual(listExport);
});
