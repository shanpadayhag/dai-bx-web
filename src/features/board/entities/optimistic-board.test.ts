import { describe, expect, test } from 'vitest';
import type BoardRecord from '@/features/board/entities/board-record';
import {
  confirmBoardWrite,
  failBoardWrite,
  startBoardWrite,
  startOptimisticBoard,
  visibleBoard,
} from '@/features/board/entities/optimistic-board';

const boardRecord = (boardName: string): BoardRecord => ({
  board: { id: 'board', name: boardName },
  lists: [],
  cards: [],
  properties: [],
});

describe('optimistic board', () => {
  test('shows a pending write on top of the confirmed board', () => {
    const pendingBoard = startBoardWrite(startOptimisticBoard(boardRecord('Personal')), 1, {
      kind: 'renameBoard',
      boardName: 'Home',
    });

    expect(visibleBoard(pendingBoard).board.name).toBe('Home');
    expect(pendingBoard.confirmedBoard.board.name).toBe('Personal');
  });

  test('a failed write rolls back to the confirmed board', () => {
    const pendingBoard = startBoardWrite(startOptimisticBoard(boardRecord('Personal')), 1, {
      kind: 'renameBoard',
      boardName: 'Home',
    });

    expect(visibleBoard(failBoardWrite(pendingBoard, 1)).board.name).toBe('Personal');
  });

  test('a confirmed write takes the server board and keeps later writes pending', () => {
    const twoPending = startBoardWrite(
      startBoardWrite(startOptimisticBoard(boardRecord('Personal')), 1, {
        kind: 'renameBoard',
        boardName: 'Home',
      }),
      2,
      { kind: 'renameBoard', boardName: 'Life' },
    );

    const firstConfirmed = confirmBoardWrite(twoPending, 1, boardRecord('Home'));

    expect(firstConfirmed.confirmedBoard.board.name).toBe('Home');
    expect(visibleBoard(firstConfirmed).board.name).toBe('Life');
  });
});
