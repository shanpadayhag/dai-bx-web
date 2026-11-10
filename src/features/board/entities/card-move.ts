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

export type { CardMoveReason };
export { describeCardMoveReason };
export default CardMove;
