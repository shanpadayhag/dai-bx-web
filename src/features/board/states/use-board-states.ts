import { useState } from 'react';
import type AppError from '@/core/app-error';
import type { Category } from '@/core/category';
import type Board from '@/features/board/entities/board';
import type CardDetailRecord from '@/features/board/entities/card-detail-record';
import type CardSchedule from '@/features/board/entities/card-schedule';
import type { OptimisticBoard } from '@/features/board/entities/optimistic-board';
import type PendingCardRename from '@/features/board/entities/pending-card-rename';
import type ScheduleRunsPage from '@/features/board/entities/schedule-runs-page';

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
  const [pendingCardRename, setPendingCardRename] = useState<PendingCardRename | null>(null);
  const [cardRenameCancelCount, setCardRenameCancelCount] = useState(0);
  const [moveDialogListId, setMoveDialogListId] = useState<string | null>(null);
  const [addressedCardId, setAddressedCardId] = useState<string | null>(null);
  const [openCardSchedules, setOpenCardSchedules] = useState<readonly CardSchedule[] | null>(null);
  const [scheduleRunsPages, setScheduleRunsPages] = useState<
    Readonly<Record<string, ScheduleRunsPage>>
  >({});
  const [scheduleCategories, setScheduleCategories] = useState<readonly Category[] | null>(null);
  const [archiveAfterByListId, setArchiveAfterByListId] = useState<
    Readonly<Record<string, string>>
  >({});
  const [archivedCardIds, setArchivedCardIds] = useState<ReadonlySet<string>>(new Set());

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
    pendingCardRename,
    setPendingCardRename,
    cardRenameCancelCount,
    setCardRenameCancelCount,
    moveDialogListId,
    setMoveDialogListId,
    addressedCardId,
    setAddressedCardId,
    openCardSchedules,
    setOpenCardSchedules,
    scheduleRunsPages,
    setScheduleRunsPages,
    scheduleCategories,
    setScheduleCategories,
    archiveAfterByListId,
    setArchiveAfterByListId,
    archivedCardIds,
    setArchivedCardIds,
  };
};

export default useBoardStates;
