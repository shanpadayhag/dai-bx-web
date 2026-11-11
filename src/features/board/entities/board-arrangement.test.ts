import { describe, expect, test } from 'vitest';
import { arrangeBoard, arrangeCardDetail } from '@/features/board/entities/board-arrangement';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardCardRecord } from '@/features/board/entities/board-record';
import type CardDetailRecord from '@/features/board/entities/card-detail-record';
import BoardPropertyKind from '@/features/board/enums/board-property-kind';

const cardRecord = (id: string, listId: string, position: number): BoardCardRecord => ({
  id,
  listId,
  position,
  title: id,
  dueDate: null,
  dueTime: null,
  values: [],
  linkedTaskCount: 0,
  doneLinkedTaskCount: 0,
  nextMove: null,
});

const boardRecord: BoardRecord = {
  board: { id: 'board', name: 'Personal' },
  lists: [
    { id: 'doing', name: 'Doing', position: 1, archiveAfter: null },
    { id: 'backlog', name: 'Backlog', position: 0, archiveAfter: null },
  ],
  cards: [
    cardRecord('second', 'backlog', 1),
    cardRecord('doing-card', 'doing', 0),
    cardRecord('first', 'backlog', 0),
  ],
  properties: [
    {
      id: 'size',
      name: 'Size',
      kind: BoardPropertyKind.Choice,
      position: 0,
      options: [
        { id: 'large', name: 'Large', color: '#8fae9a', position: 1 },
        { id: 'small', name: 'Small', color: null, position: 0 },
      ],
    },
  ],
};

describe('arrangeBoard', () => {
  test('nests each list’s cards and orders everything by position', () => {
    const boardContents = arrangeBoard(boardRecord);

    expect(
      boardContents.lists.map((boardList) => [
        boardList.name,
        boardList.cards.map((boardCard) => boardCard.id),
      ]),
    ).toEqual([
      ['Backlog', ['first', 'second']],
      ['Doing', ['doing-card']],
    ]);
    expect(boardContents.properties[0]?.options).toEqual([
      { id: 'small', name: 'Small', color: null },
      { id: 'large', name: 'Large', color: '#8fae9a' },
    ]);
  });

  test('keeps a list with no cards, and drops the record-only fields from cards', () => {
    const boardContents = arrangeBoard({
      ...boardRecord,
      lists: [...boardRecord.lists, { id: 'done', name: 'Done', position: 2, archiveAfter: null }],
    });

    expect(boardContents.lists[2]).toEqual({
      id: 'done',
      name: 'Done',
      archiveAfter: null,
      cards: [],
    });
    expect(boardContents.lists[0]?.cards[0]).not.toHaveProperty('listId');
    expect(boardContents.lists[0]?.cards[0]).not.toHaveProperty('position');
  });
});

describe('arrangeCardDetail', () => {
  const cardDetailRecord: CardDetailRecord = {
    card: cardRecord('doing-card', 'doing', 0),
    notes: '## Outcome\n',
    linkedTasks: [],
    trackedEventCount: 0,
    schedules: [],
    triggers: { started: null, finished: null },
    archived: null,
  };

  test('names the list the card sits in', () => {
    expect(arrangeCardDetail(cardDetailRecord, boardRecord)).toEqual({
      card: {
        id: 'doing-card',
        title: 'doing-card',
        dueDate: null,
        dueTime: null,
        values: [],
        linkedTaskCount: 0,
        doneLinkedTaskCount: 0,
        nextMove: null,
      },
      listName: 'Doing',
      notes: '## Outcome\n',
      linkedTasks: [],
    });
  });

  test('gives nothing when the card’s list is not on the board', () => {
    expect(
      arrangeCardDetail(
        { ...cardDetailRecord, card: cardRecord('lost', 'elsewhere', 0) },
        boardRecord,
      ),
    ).toBeNull();
  });
});

describe('a card with a scheduled move', () => {
  test('carries its next move with the time as a date', () => {
    const scheduledBoard: BoardRecord = {
      ...boardRecord,
      cards: [
        {
          ...cardRecord('doing-card', 'doing', 0),
          nextMove: { at: '2026-11-09T10:00:00.000Z', listName: 'Backlog' },
        },
      ],
    };

    expect(arrangeBoard(scheduledBoard).lists[1]?.cards[0]?.nextMove).toEqual({
      at: new Date('2026-11-09T10:00:00.000Z'),
      listName: 'Backlog',
    });
  });
});
