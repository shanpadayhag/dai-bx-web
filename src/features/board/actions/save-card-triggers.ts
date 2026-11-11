import backendCardSource from '@/features/board/data_sources/backend/card-source';
import type { BoardCardRecord } from '@/features/board/entities/board-record';
import type CardTriggers from '@/features/board/entities/card-triggers';

const saveCardTriggers = async (
  cardId: BoardCardRecord['id'],
  cardTriggers: CardTriggers,
): Promise<CardTriggers> =>
  (
    await backendCardSource.saveTriggers(cardId, {
      startedListId: cardTriggers.started?.listId ?? null,
      finishedListId: cardTriggers.finished?.listId ?? null,
    })
  ).triggers;

export default saveCardTriggers;
