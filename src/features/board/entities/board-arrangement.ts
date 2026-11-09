import type BoardContents from '@/features/board/entities/board-contents';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardCardRecord } from '@/features/board/entities/board-record';
import type BoardCard from '@/features/board/entities/board-card';
import type CardDetail from '@/features/board/entities/card-detail';
import type CardDetailRecord from '@/features/board/entities/card-detail-record';
import { nextMoveFromRecord } from '@/features/board/entities/next-move';

type Positioned = { position: number };

const byPosition = (firstItem: Positioned, secondItem: Positioned) =>
  firstItem.position - secondItem.position;

const toBoardCard = (cardRecord: BoardCardRecord): BoardCard => ({
  id: cardRecord.id,
  title: cardRecord.title,
  dueDate: cardRecord.dueDate,
  dueTime: cardRecord.dueTime,
  values: cardRecord.values,
  linkedTaskCount: cardRecord.linkedTaskCount,
  doneLinkedTaskCount: cardRecord.doneLinkedTaskCount,
  nextMove: cardRecord.nextMove === null ? null : nextMoveFromRecord(cardRecord.nextMove),
});

export const arrangeBoard = (boardRecord: BoardRecord): BoardContents => {
  const cardsByListId = new Map<string, BoardCardRecord[]>();
  for (const cardRecord of boardRecord.cards) {
    const listCards = cardsByListId.get(cardRecord.listId) ?? [];
    listCards.push(cardRecord);
    cardsByListId.set(cardRecord.listId, listCards);
  }
  return {
    board: boardRecord.board,
    lists: [...boardRecord.lists].sort(byPosition).map((listRecord) => ({
      id: listRecord.id,
      name: listRecord.name,
      cards: (cardsByListId.get(listRecord.id) ?? []).sort(byPosition).map(toBoardCard),
    })),
    properties: [...boardRecord.properties].sort(byPosition).map((propertyRecord) => ({
      id: propertyRecord.id,
      name: propertyRecord.name,
      kind: propertyRecord.kind,
      options: [...propertyRecord.options]
        .sort(byPosition)
        .map(({ id, name, color }) => ({ id, name, color })),
    })),
  };
};

export const arrangeCardDetail = (
  cardDetailRecord: Omit<CardDetailRecord, 'trackedEventCount' | 'schedules'>,
  boardRecord: BoardRecord,
): CardDetail | null => {
  const cardList = boardRecord.lists.find(
    (listRecord) => listRecord.id === cardDetailRecord.card.listId,
  );
  if (cardList === undefined) return null;
  return {
    card: toBoardCard(cardDetailRecord.card),
    listName: cardList.name,
    notes: cardDetailRecord.notes,
    linkedTasks: cardDetailRecord.linkedTasks,
  };
};
