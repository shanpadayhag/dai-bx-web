import { useState } from 'react';
import type AppError from '@/core/app-error';
import type { Category } from '@/core/category';
import type Board from '@/features/board/entities/board';
import type { ArchivedCardsPage } from '@/features/board/entities/card-archive';
import type CardDetailRecord from '@/features/board/entities/card-detail-record';
import type CardHistoryPage from '@/features/board/entities/card-history-page';
import type CardSchedule from '@/features/board/entities/card-schedule';
import type { OptimisticBoard } from '@/features/board/entities/optimistic-board';
import type PendingCardRename from '@/features/board/entities/pending-card-rename';
import type ScheduleRunsPage from '@/features/board/entities/schedule-runs-page';
import type CardTriggers from '@/features/board/entities/card-triggers';

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
  const [openCardTriggers, setOpenCardTriggers] = useState<CardTriggers | null>(null);
  const [cardHistoryPage, setCardHistoryPage] = useState<CardHistoryPage | null>(null);
  const [archivedCardsPage, setArchivedCardsPage] = useState<ArchivedCardsPage | null>(null);
  const [deleteTargetArchivedCardId, setDeleteTargetArchivedCardId] = useState<string | null>(null);

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
    openCardTriggers,
    setOpenCardTriggers,
    cardHistoryPage,
    setCardHistoryPage,
    archivedCardsPage,
    setArchivedCardsPage,
    deleteTargetArchivedCardId,
    setDeleteTargetArchivedCardId,
  };
};

export default useBoardStates;
