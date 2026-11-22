import findArchivedCards from '@/features/board/actions/find-archived-cards';
import type Board from '@/features/board/entities/board';
import type { ArchivedCard, ArchivedCardsPage } from '@/features/board/entities/card-archive';

const MOST_PAGES_TO_SEARCH = 20;

const findArchivedCardsThrough = async (
  boardId: Board['id'],
  wantedCardId: string,
): Promise<ArchivedCardsPage> => {
  let loadedCards: readonly ArchivedCard[] = [];
  let hasOlderCards = true;
  for (let pageNumber = 0; pageNumber < MOST_PAGES_TO_SEARCH && hasOlderCards; pageNumber += 1) {
    const loadedPage = await findArchivedCards(boardId, loadedCards.at(-1)?.id ?? null);
    loadedCards = [...loadedCards, ...loadedPage.cards];
    hasOlderCards = loadedPage.hasOlderCards;
    if (loadedPage.cards.some((archivedCard) => archivedCard.id === wantedCardId)) break;
  }
  return { cards: loadedCards, hasOlderCards };
};

export default findArchivedCardsThrough;
