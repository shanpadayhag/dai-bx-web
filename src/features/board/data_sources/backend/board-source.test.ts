import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import backendBoardSource from '@/features/board/data_sources/backend/board-source';
import type BoardRecord from '@/features/board/entities/board-record';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const boardRecord: BoardRecord = {
  board: { id: 'b1', name: 'Personal' },
  lists: [],
  cards: [],
  properties: [],
};

test('lists boards and reads one board', async () => {
  backendServer.use(
    http.get('/backend/boards', () => HttpResponse.json([{ id: 'b1', name: 'Personal' }])),
    http.get('/backend/boards/b1', () => HttpResponse.json(boardRecord)),
  );

  await expect(backendBoardSource.findAll()).resolves.toEqual([{ id: 'b1', name: 'Personal' }]);
  await expect(backendBoardSource.find('b1')).resolves.toEqual(boardRecord);
});

test('creates and renames a board with its name, and deletes it', async () => {
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
    http.post('/backend/boards', recordRequest),
    http.patch('/backend/boards/b1', recordRequest),
    http.delete('/backend/boards/b1', () => HttpResponse.json({ status: 'deleted' })),
  );

  await backendBoardSource.create('Personal');
  await backendBoardSource.rename('b1', 'Home');

  expect(receivedRequests).toEqual([
    { method: 'POST', path: '/backend/boards', body: { name: 'Personal' } },
    { method: 'PATCH', path: '/backend/boards/b1', body: { name: 'Home' } },
  ]);
  await expect(backendBoardSource.delete('b1')).resolves.toEqual({ status: 'deleted' });
});
