import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import setListArchiveAfter from '@/features/board/actions/set-list-archive-after';
import type BoardRecord from '@/features/board/entities/board-record';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const boardRecord: BoardRecord = {
  board: { id: 'b1', name: 'Personal' },
  lists: [{ id: 'l1', name: 'Done', position: 0, archiveAfter: '1w 3d' }],
  cards: [],
  properties: [],
};

test('sends a trimmed length, or null for an empty box, and answers the board', async () => {
  const sentLengths: unknown[] = [];
  backendServer.use(
    http.patch('/backend/lists/l1', async ({ request }) => {
      sentLengths.push(((await request.json()) as { archiveAfter: unknown }).archiveAfter);
      return HttpResponse.json(boardRecord);
    }),
  );

  await expect(setListArchiveAfter('l1', '  10d ')).resolves.toEqual({ boardRecord });
  await setListArchiveAfter('l1', '   ');

  expect(sentLengths).toEqual(['10d', null]);
});

test("answers the API's hint for a refused length", async () => {
  backendServer.use(
    http.patch('/backend/lists/l1', () =>
      HttpResponse.json({ error: 'Use days, weeks or months, like 3d, 2w or 1m' }, { status: 422 }),
    ),
  );

  await expect(setListArchiveAfter('l1', '3x')).resolves.toEqual({
    hint: 'Use days, weeks or months, like 3d, 2w or 1m.',
  });
});
