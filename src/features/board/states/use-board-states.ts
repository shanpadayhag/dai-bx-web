import { useState } from 'react';
import type AppError from '@/core/app-error';
import type Board from '@/features/board/entities/board';
import type CardDetailRecord from '@/features/board/entities/card-detail-record';
import type { OptimisticBoard } from '@/features/board/entities/optimistic-board';

const useBoardStates = () => {
  const [boards, setBoards] = useState<readonly Board[] | null>(null);
  const [pageLoadError, setPageLoadError] = useState<AppError | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [optimisticBoard, setOptimisticBoard] = useState<OptimisticBoard | null>(null);
  const [submittingDialogId, setSubmittingDialogId] = useState<string | null>(null);
  const [composingListId, setComposingListId] = useState<string | null>(null);
  const [renameTargetListId, setRenameTargetListId] = useState<string | null>(null);
  const [deleteTargetListId, setDeleteTargetListId] = useState<string | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [deleteTargetPropertyId, setDeleteTargetPropertyId] = useState<string | null>(null);
  const [deleteTargetOptionId, setDeleteTargetOptionId] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [openCardDetail, setOpenCardDetail] = useState<CardDetailRecord | null>(null);
  const [moveDialogListId, setMoveDialogListId] = useState<string | null>(null);
  const [addressedCardId, setAddressedCardId] = useState<string | null>(null);

  return {
    boards,
    setBoards,
    pageLoadError,
    setPageLoadError,
    selectedBoardId,
    setSelectedBoardId,
    optimisticBoard,
    setOptimisticBoard,
    submittingDialogId,
    setSubmittingDialogId,
    composingListId,
    setComposingListId,
    renameTargetListId,
    setRenameTargetListId,
    deleteTargetListId,
    setDeleteTargetListId,
    editingPropertyId,
    setEditingPropertyId,
    deleteTargetPropertyId,
    setDeleteTargetPropertyId,
    deleteTargetOptionId,
    setDeleteTargetOptionId,
    openCardId,
    setOpenCardId,
    openCardDetail,
    setOpenCardDetail,
    moveDialogListId,
    setMoveDialogListId,
    addressedCardId,
    setAddressedCardId,
  };
};

export default useBoardStates;
