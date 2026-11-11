type CardMoveReason =
  'byHand' | 'schedule' | 'started' | 'finished' | 'archivedIdle' | 'archivedByHand' | 'restored';

type CardMove = {
  id: string;
  movedAt: Date;
  fromListName: string | null;
  toListName: string | null;
  reason: CardMoveReason;
  taskTitle: string | null;
};

type CardMoveRecord = Omit<CardMove, 'movedAt'> & { movedAt: string };

type CardHistoryRecord = {
  moves: CardMoveRecord[];
  hasMore: boolean;
};

const cardMoveFromRecord = (cardMoveRecord: CardMoveRecord): CardMove => ({
  ...cardMoveRecord,
  movedAt: new Date(cardMoveRecord.movedAt),
});

const describeCardMoveReason = (cardMove: CardMove): string => {
  switch (cardMove.reason) {
    case 'byHand':
      return 'Moved by hand';
    case 'schedule':
      return 'Moved by a schedule';
    case 'started':
      return cardMove.taskTitle === null ? 'Started the card' : `Started “${cardMove.taskTitle}”`;
    case 'finished':
      return `Finished “${cardMove.taskTitle ?? 'its last task'}”`;
    case 'archivedIdle':
      return 'Archived, by idle';
    case 'archivedByHand':
      return 'Archived by hand';
    case 'restored':
      return 'Restored';
  }
};

export type { CardHistoryRecord, CardMoveReason, CardMoveRecord };
export { cardMoveFromRecord, describeCardMoveReason };
export default CardMove;
