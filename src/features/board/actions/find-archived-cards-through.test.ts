import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import findArchivedCardsThrough from '@/features/board/actions/find-archived-cards-through';
import startBackendServer from '@/test-support/backend-server';

const backendServer = startBackendServer();

const archivedRecord = (cardId: string) => ({
  id: cardId,
  title: `Card ${cardId}`,
  fromListName: 'Backlog',
  archivedAt: '2026-11-08T09:00:00.000Z',
  how: 'byHand',
});

const serveArchivedPages = (pages: string[][]) => {
  const requestedBefores: (string | null)[] = [];
  backendServer.use(
    http.get('/backend/boards/:boardId/archived-cards', ({ request }) => {
      const beforeCardId = new URL(request.url).searchParams.get('before');
      requestedBefores.push(beforeCardId);
      const pageIndex = requestedBefores.length - 1;
      return HttpResponse.json({
        cards: (pages[pageIndex] ?? []).map(archivedRecord),
        hasMore: pageIndex < pages.length - 1,
      });
    }),
  );
  return requestedBefores;
};

test('pages back until the wanted card is loaded', async () => {
  const requestedBefores = serveArchivedPages([['c1', 'c2'], ['c3', 'c4'], ['c5']]);

  const archivedPage = await findArchivedCardsThrough('board-1', 'c3');

  expect(archivedPage.cards.map((archivedCard) => archivedCard.id)).toEqual([
    'c1',
    'c2',
    'c3',
    'c4',
  ]);
  expect(archivedPage.hasOlderCards).toBe(true);
  expect(requestedBefores).toEqual([null, 'c2']);
});

test('stops at the last page when the card is not archived', async () => {
  serveArchivedPages([['c1'], ['c2']]);

  const archivedPage = await findArchivedCardsThrough('board-1', 'missing');

  expect(archivedPage.cards.map((archivedCard) => archivedCard.id)).toEqual(['c1', 'c2']);
  expect(archivedPage.hasOlderCards).toBe(false);
});
