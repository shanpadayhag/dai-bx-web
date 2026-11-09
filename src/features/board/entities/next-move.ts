import { formatScheduleMoment } from '@/features/board/entities/card-schedule';
import type { NextMoveRecord } from '@/features/board/entities/card-schedule-record';

type NextMove = {
  at: Date;
  listName: string;
};

const nextMoveFromRecord = (nextMoveRecord: NextMoveRecord): NextMove => ({
  at: new Date(nextMoveRecord.at),
  listName: nextMoveRecord.listName,
});

const nextMoveLabel = (nextMove: NextMove, now: Date, timeZone: string): string =>
  `${formatScheduleMoment(nextMove.at, now, timeZone)} → ${nextMove.listName}`;

export { nextMoveFromRecord, nextMoveLabel };
export default NextMove;
