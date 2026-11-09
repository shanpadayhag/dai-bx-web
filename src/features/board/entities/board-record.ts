import type Board from '@/features/board/entities/board';
import type { NextMoveRecord } from '@/features/board/entities/card-schedule-record';
import type CardPropertyValue from '@/features/board/entities/card-property-value';
import type BoardPropertyKind from '@/features/board/enums/board-property-kind';

export type BoardListRecord = {
  id: string;
  name: string;
  position: number;
};

export type BoardCardRecord = {
  id: string;
  listId: string;
  position: number;
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  values: CardPropertyValue[];
  linkedTaskCount: number;
  doneLinkedTaskCount: number;
  nextMove: NextMoveRecord | null;
};

export type PropertyOptionRecord = {
  id: string;
  name: string;
  color: string | null;
  position: number;
};

export type BoardPropertyRecord = {
  id: string;
  name: string;
  kind: BoardPropertyKind;
  position: number;
  options: PropertyOptionRecord[];
};

type BoardRecord = {
  board: Board;
  lists: BoardListRecord[];
  cards: BoardCardRecord[];
  properties: BoardPropertyRecord[];
};

export default BoardRecord;
