import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import backendBoardPropertySource from '@/features/board/data_sources/backend/board-property-source';
import type BoardRecord from '@/features/board/entities/board-record';
import BoardPropertyKind from '@/features/board/enums/board-property-kind';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const boardRecord: BoardRecord = {
  board: { id: 'b1', name: 'Personal' },
  lists: [],
  cards: [],
  properties: [],
};

test('sends each property and option write to its route with its body', async () => {
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
    http.post('/backend/boards/b1/properties', recordRequest),
    http.patch('/backend/properties/p1', recordRequest),
    http.post('/backend/properties/p1/move', recordRequest),
    http.delete('/backend/properties/p1', recordRequest),
    http.post('/backend/properties/p1/options', recordRequest),
    http.patch('/backend/options/o1', recordRequest),
    http.post('/backend/options/o1/move', recordRequest),
    http.delete('/backend/options/o1', recordRequest),
  );

  await backendBoardPropertySource.create('b1', {
    name: 'Size',
    kind: BoardPropertyKind.Choice,
    options: [{ name: 'Small', color: '#6f9a7d' }, { name: 'Large' }],
  });
  await backendBoardPropertySource.rename('p1', 'Effort');
  await backendBoardPropertySource.move('p1', 1);
  await backendBoardPropertySource.delete('p1');
  await backendBoardPropertySource.createOption('p1', { name: 'Huge' });
  await backendBoardPropertySource.updateOption('o1', { color: null });
  await backendBoardPropertySource.moveOption('o1', 0);
  await backendBoardPropertySource.deleteOption('o1');

  expect(receivedRequests).toEqual([
    {
      method: 'POST',
      path: '/backend/boards/b1/properties',
      body: {
        name: 'Size',
        kind: 'choice',
        options: [{ name: 'Small', color: '#6f9a7d' }, { name: 'Large' }],
      },
    },
    { method: 'PATCH', path: '/backend/properties/p1', body: { name: 'Effort' } },
    { method: 'POST', path: '/backend/properties/p1/move', body: { position: 1 } },
    { method: 'DELETE', path: '/backend/properties/p1', body: {} },
    { method: 'POST', path: '/backend/properties/p1/options', body: { name: 'Huge' } },
    { method: 'PATCH', path: '/backend/options/o1', body: { color: null } },
    { method: 'POST', path: '/backend/options/o1/move', body: { position: 0 } },
    { method: 'DELETE', path: '/backend/options/o1', body: {} },
  ]);
});
