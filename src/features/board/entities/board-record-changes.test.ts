import { describe, expect, test } from 'vitest';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardCardRecord } from '@/features/board/entities/board-record';
import { applyBoardChange } from '@/features/board/entities/board-record-changes';
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
    { id: 'backlog', name: 'Backlog', position: 0, archiveAfter: null },
    { id: 'doing', name: 'Doing', position: 1, archiveAfter: null },
    { id: 'done', name: 'Done', position: 2, archiveAfter: null },
  ],
  cards: [
    {
      ...cardRecord('first', 'backlog', 0),
      values: [
        { propertyId: 'size', optionId: 'small' },
        { propertyId: 'hours', number: '2.50' },
      ],
    },
    cardRecord('second', 'backlog', 1),
    cardRecord('third', 'backlog', 2),
    {
      ...cardRecord('doing-card', 'doing', 0),
      values: [{ propertyId: 'size', optionId: 'large' }],
    },
  ],
  properties: [
    {
      id: 'size',
      name: 'Size',
      kind: BoardPropertyKind.Choice,
      position: 0,
      options: [
        { id: 'small', name: 'Small', color: null, position: 0 },
        { id: 'large', name: 'Large', color: null, position: 1 },
      ],
    },
    { id: 'hours', name: 'Hours', kind: BoardPropertyKind.Number, position: 1, options: [] },
  ],
};

const listOrder = (changedBoard: BoardRecord) =>
  [...changedBoard.lists]
    .sort((firstList, secondList) => firstList.position - secondList.position)
    .map((listRecord) => `${listRecord.id}@${listRecord.position}`);

const cardOrder = (changedBoard: BoardRecord, listId: string) =>
  changedBoard.cards
    .filter((card) => card.listId === listId)
    .sort((firstCard, secondCard) => firstCard.position - secondCard.position)
    .map((card) => `${card.id}@${card.position}`);

const cardOf = (changedBoard: BoardRecord, cardId: string) =>
  changedBoard.cards.find((card) => card.id === cardId);

describe('applyBoardChange', () => {
  test('renames the board and a list', () => {
    const renamedBoard = applyBoardChange(
      applyBoardChange(boardRecord, { kind: 'renameBoard', boardName: 'Home' }),
      { kind: 'renameList', listId: 'doing', listName: 'Now' },
    );

    expect(renamedBoard.board.name).toBe('Home');
    expect(renamedBoard.lists.find((listRecord) => listRecord.id === 'doing')?.name).toBe('Now');
  });

  test('adds a list last whatever position it arrives with', () => {
    const changedBoard = applyBoardChange(boardRecord, {
      kind: 'addList',
      listRecord: { id: 'ideas', name: 'Ideas', position: 0, archiveAfter: null },
    });

    expect(listOrder(changedBoard)).toEqual(['backlog@0', 'doing@1', 'done@2', 'ideas@3']);
  });

  test('moves a list and clamps a position past the end', () => {
    const movedForward = applyBoardChange(boardRecord, {
      kind: 'moveList',
      listId: 'backlog',
      position: 1,
    });
    const movedPastEnd = applyBoardChange(boardRecord, {
      kind: 'moveList',
      listId: 'backlog',
      position: 99,
    });

    expect(listOrder(movedForward)).toEqual(['doing@0', 'backlog@1', 'done@2']);
    expect(listOrder(movedPastEnd)).toEqual(['doing@0', 'done@1', 'backlog@2']);
  });

  test('deleting a list removes its cards and closes the gap', () => {
    const changedBoard = applyBoardChange(boardRecord, { kind: 'deleteList', listId: 'backlog' });

    expect(listOrder(changedBoard)).toEqual(['doing@0', 'done@1']);
    expect(changedBoard.cards.map((card) => card.id)).toEqual(['doing-card']);
  });

  test('adds a card last in its own list', () => {
    const changedBoard = applyBoardChange(boardRecord, {
      kind: 'addCard',
      cardRecord: cardRecord('new', 'backlog', 0),
    });

    expect(cardOrder(changedBoard, 'backlog')).toEqual(['first@0', 'second@1', 'third@2', 'new@3']);
    expect(cardOrder(changedBoard, 'doing')).toEqual(['doing-card@0']);
  });

  test('updates only the card fields it names', () => {
    const changedBoard = applyBoardChange(boardRecord, {
      kind: 'updateCard',
      cardId: 'second',
      dueDate: '2026-11-05',
      dueTime: '18:00',
    });
    const clearedBoard = applyBoardChange(changedBoard, {
      kind: 'updateCard',
      cardId: 'second',
      dueTime: null,
    });

    expect(cardOf(changedBoard, 'second')).toMatchObject({
      title: 'second',
      dueDate: '2026-11-05',
      dueTime: '18:00',
    });
    expect(cardOf(clearedBoard, 'second')).toMatchObject({
      dueDate: '2026-11-05',
      dueTime: null,
    });
  });

  test('moves a card within its list', () => {
    const changedBoard = applyBoardChange(boardRecord, {
      kind: 'moveCard',
      cardId: 'first',
      listId: 'backlog',
      position: 2,
    });

    expect(cardOrder(changedBoard, 'backlog')).toEqual(['second@0', 'third@1', 'first@2']);
  });

  test('moves a card to another list, closing one gap and opening the other', () => {
    const changedBoard = applyBoardChange(boardRecord, {
      kind: 'moveCard',
      cardId: 'second',
      listId: 'doing',
      position: 0,
    });

    expect(cardOrder(changedBoard, 'backlog')).toEqual(['first@0', 'third@1']);
    expect(cardOrder(changedBoard, 'doing')).toEqual(['second@0', 'doing-card@1']);
  });

  test('clamps a card moved past the end of a list, and to the start of an empty one', () => {
    const pastEnd = applyBoardChange(boardRecord, {
      kind: 'moveCard',
      cardId: 'first',
      listId: 'doing',
      position: 99,
    });
    const intoEmpty = applyBoardChange(boardRecord, {
      kind: 'moveCard',
      cardId: 'first',
      listId: 'done',
      position: 5,
    });

    expect(cardOrder(pastEnd, 'doing')).toEqual(['doing-card@0', 'first@1']);
    expect(cardOrder(intoEmpty, 'done')).toEqual(['first@0']);
  });

  test('leaves the board alone when a card moves to a list it does not have', () => {
    const changedBoard = applyBoardChange(boardRecord, {
      kind: 'moveCard',
      cardId: 'first',
      listId: 'elsewhere',
      position: 0,
    });

    expect(changedBoard).toBe(boardRecord);
  });

  test('deleting a card closes the gap in its list', () => {
    const changedBoard = applyBoardChange(boardRecord, { kind: 'deleteCard', cardId: 'first' });

    expect(cardOrder(changedBoard, 'backlog')).toEqual(['second@0', 'third@1']);
  });

  test('sets a value in property order, replaces it, and clears it', () => {
    const withHours = applyBoardChange(boardRecord, {
      kind: 'setValue',
      cardId: 'doing-card',
      cardValue: { propertyId: 'hours', number: '2.50' },
    });
    const withSizeReplaced = applyBoardChange(withHours, {
      kind: 'setValue',
      cardId: 'doing-card',
      cardValue: { propertyId: 'size', optionId: 'small' },
    });
    const withSizeCleared = applyBoardChange(withSizeReplaced, {
      kind: 'clearValue',
      cardId: 'doing-card',
      propertyId: 'size',
    });

    expect(cardOf(withSizeReplaced, 'doing-card')?.values).toEqual([
      { propertyId: 'size', optionId: 'small' },
      { propertyId: 'hours', number: '2.50' },
    ]);
    expect(cardOf(withSizeCleared, 'doing-card')?.values).toEqual([
      { propertyId: 'hours', number: '2.50' },
    ]);
  });

  test('adds, renames and moves properties', () => {
    const withLink = applyBoardChange(boardRecord, {
      kind: 'addProperty',
      propertyRecord: {
        id: 'link',
        name: 'Link',
        kind: BoardPropertyKind.Text,
        position: 0,
        options: [],
      },
    });
    const renamedAndMoved = applyBoardChange(
      applyBoardChange(withLink, {
        kind: 'renameProperty',
        propertyId: 'link',
        propertyName: 'URL',
      }),
      { kind: 'moveProperty', propertyId: 'link', position: 0 },
    );

    expect(
      renamedAndMoved.properties.map(
        (propertyRecord) => `${propertyRecord.name}@${propertyRecord.position}`,
      ),
    ).toEqual(['URL@0', 'Size@1', 'Hours@2']);
  });

  test('deleting a property clears its values from every card', () => {
    const changedBoard = applyBoardChange(boardRecord, {
      kind: 'deleteProperty',
      propertyId: 'size',
    });

    expect(changedBoard.properties.map((propertyRecord) => propertyRecord.position)).toEqual([0]);
    expect(cardOf(changedBoard, 'first')?.values).toEqual([
      { propertyId: 'hours', number: '2.50' },
    ]);
    expect(cardOf(changedBoard, 'doing-card')?.values).toEqual([]);
  });

  test('adds an option last, updates it with a lowercased color, and moves it', () => {
    const withHuge = applyBoardChange(boardRecord, {
      kind: 'addOption',
      propertyId: 'size',
      optionRecord: { id: 'huge', name: 'Huge', color: null, position: 0 },
    });
    const updated = applyBoardChange(withHuge, {
      kind: 'updateOption',
      optionId: 'huge',
      optionName: 'Giant',
      color: '#22C55E',
    });
    const moved = applyBoardChange(updated, { kind: 'moveOption', optionId: 'huge', position: 0 });

    expect(moved.properties[0]?.options).toEqual([
      { id: 'huge', name: 'Giant', color: '#22c55e', position: 0 },
      { id: 'small', name: 'Small', color: null, position: 1 },
      { id: 'large', name: 'Large', color: null, position: 2 },
    ]);
  });

  test('deleting an option clears only the values that chose it', () => {
    const changedBoard = applyBoardChange(boardRecord, {
      kind: 'deleteOption',
      optionId: 'small',
    });

    expect(changedBoard.properties[0]?.options).toEqual([
      { id: 'large', name: 'Large', color: null, position: 0 },
    ]);
    expect(cardOf(changedBoard, 'first')?.values).toEqual([
      { propertyId: 'hours', number: '2.50' },
    ]);
    expect(cardOf(changedBoard, 'doing-card')?.values).toEqual([
      { propertyId: 'size', optionId: 'large' },
    ]);
  });
});
