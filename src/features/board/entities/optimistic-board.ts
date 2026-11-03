import type BoardRecord from '@/features/board/entities/board-record';
import {
  applyBoardChange,
  type LocalBoardChange,
} from '@/features/board/entities/board-record-changes';

export type PendingBoardWrite = {
  writeId: number;
  localChange: LocalBoardChange;
};

export type OptimisticBoard = {
  confirmedBoard: BoardRecord;
  pendingWrites: readonly PendingBoardWrite[];
};

export const startOptimisticBoard = (confirmedBoard: BoardRecord): OptimisticBoard => ({
  confirmedBoard,
  pendingWrites: [],
});

export const startBoardWrite = (
  optimisticBoard: OptimisticBoard,
  writeId: number,
  localChange: LocalBoardChange,
): OptimisticBoard => ({
  ...optimisticBoard,
  pendingWrites: [...optimisticBoard.pendingWrites, { writeId, localChange }],
});

const withoutWrite = (pendingWrites: readonly PendingBoardWrite[], writeId: number) =>
  pendingWrites.filter((pendingWrite) => pendingWrite.writeId !== writeId);

export const confirmBoardWrite = (
  optimisticBoard: OptimisticBoard,
  writeId: number,
  serverBoard: BoardRecord,
): OptimisticBoard => ({
  confirmedBoard: serverBoard,
  pendingWrites: withoutWrite(optimisticBoard.pendingWrites, writeId),
});

export const failBoardWrite = (
  optimisticBoard: OptimisticBoard,
  writeId: number,
): OptimisticBoard => ({
  ...optimisticBoard,
  pendingWrites: withoutWrite(optimisticBoard.pendingWrites, writeId),
});

export const visibleBoard = (optimisticBoard: OptimisticBoard): BoardRecord =>
  optimisticBoard.pendingWrites.reduce(
    (currentBoard, pendingWrite) => applyBoardChange(currentBoard, pendingWrite.localChange),
    optimisticBoard.confirmedBoard,
  );
