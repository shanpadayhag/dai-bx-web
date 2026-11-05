import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, type FormEvent } from 'react';
import { toast } from 'sonner';
import AppError from '@/core/app-error';
import readFormText from '@/core/form-text';
import hidePopover from '@/core/popover';
import { trackedEventCountOf, type RenameEventsAnswer } from '@/core/rename-events';
import reportAppError from '@/core/report-app-error';
import clearCardValue from '@/features/board/actions/clear-card-value';
import createBoard, { readBoardName } from '@/features/board/actions/create-board';
import createBoardList, { readListName } from '@/features/board/actions/create-board-list';
import createBoardProperty, {
  readOptionName,
  readPropertyName,
  type NewPropertyEntry,
} from '@/features/board/actions/create-board-property';
import createCard, { readCardTitle } from '@/features/board/actions/create-card';
import createPropertyOption from '@/features/board/actions/create-property-option';
import deleteBoard from '@/features/board/actions/delete-board';
import deleteBoardList from '@/features/board/actions/delete-board-list';
import deleteBoardProperty from '@/features/board/actions/delete-board-property';
import deleteCard from '@/features/board/actions/delete-card';
import deletePropertyOption from '@/features/board/actions/delete-property-option';
import findBoard from '@/features/board/actions/find-board';
import findBoards from '@/features/board/actions/find-boards';
import findCardDetail from '@/features/board/actions/find-card-detail';
import findListForPlanning from '@/features/board/actions/find-list-for-planning';
import moveBoardList from '@/features/board/actions/move-board-list';
import moveBoardProperty from '@/features/board/actions/move-board-property';
import moveCard from '@/features/board/actions/move-card';
import movePropertyOption from '@/features/board/actions/move-property-option';
import renameBoard from '@/features/board/actions/rename-board';
import renameBoardList from '@/features/board/actions/rename-board-list';
import renameBoardProperty from '@/features/board/actions/rename-board-property';
import renameCard from '@/features/board/actions/rename-card';
import setCardValue, { readCardValueInput } from '@/features/board/actions/set-card-value';
import updateCardDue from '@/features/board/actions/update-card-due';
import updateCardNotes from '@/features/board/actions/update-card-notes';
import updatePropertyOption from '@/features/board/actions/update-property-option';
import localStorageBoardViewSource from '@/features/board/data_sources/local_storage/board-view-source';
import type Board from '@/features/board/entities/board';
import type BoardRecord from '@/features/board/entities/board-record';
import type { LocalBoardChange } from '@/features/board/entities/board-record-changes';
import type CardPropertyValue from '@/features/board/entities/card-property-value';
import {
  confirmBoardWrite,
  failBoardWrite,
  startBoardWrite,
  startOptimisticBoard,
  visibleBoard,
} from '@/features/board/entities/optimistic-board';
import type useBoardStates from '@/features/board/states/use-board-states';

export const BOARD_SWITCHER_MENU_ID = 'board-switcher-menu';
export const NEW_BOARD_DIALOG_ID = 'new-board-dialog';
export const NEW_LIST_DIALOG_ID = 'new-list-dialog';
export const RENAME_LIST_DIALOG_ID = 'rename-list-dialog';
export const DELETE_LIST_DIALOG_ID = 'delete-list-dialog';
export const BOARD_SETTINGS_DIALOG_ID = 'board-settings-dialog';
export const DELETE_BOARD_DIALOG_ID = 'delete-board-dialog';
export const PROPERTY_FORM_DIALOG_ID = 'property-form-dialog';
export const NEW_PROPERTY_DIALOG_ID = 'new-property-dialog';
export const DELETE_PROPERTY_DIALOG_ID = 'delete-property-dialog';
export const DELETE_OPTION_DIALOG_ID = 'delete-option-dialog';
export const CARD_DETAIL_DIALOG_ID = 'card-detail-dialog';
export const MOVE_CARD_DIALOG_ID = 'move-card-dialog';
export const DELETE_CARD_DIALOG_ID = 'delete-card-dialog';
export const PENDING_CARD_ID_PREFIX = 'pending-card-';
export const RENAME_CARD_EVENTS_DIALOG_ID = 'rename-card-events-dialog';
const BOARD_PATH = '/board';
const BOARD_QUERY_NAME = 'board';
const CARD_QUERY_NAME = 'card';

const boardPath = (boardId: string | null) =>
  boardId === null ? BOARD_PATH : `${BOARD_PATH}?${BOARD_QUERY_NAME}=${boardId}`;

const showPopover = (popoverId: string) => {
  const popoverElement = document.getElementById(popoverId);
  if (popoverElement === null || typeof popoverElement.showPopover !== 'function') return;
  if (!popoverElement.matches(':popover-open')) popoverElement.showPopover();
};

const pickStartingBoardId = (boards: readonly Board[]) => {
  const isKnownBoard = (boardId: string | null) =>
    boardId !== null && boards.some((board) => board.id === boardId);
  const addressedBoardId = new URLSearchParams(window.location.search).get(BOARD_QUERY_NAME);
  if (isKnownBoard(addressedBoardId)) return addressedBoardId;
  const lastBoardId = localStorageBoardViewSource.findLastBoardId();
  if (isKnownBoard(lastBoardId)) return lastBoardId;
  return boards[0]?.id ?? null;
};

const writePlanningText = async (planningText: Promise<string>) => {
  if (typeof ClipboardItem === 'undefined' || typeof navigator.clipboard.write !== 'function') {
    await navigator.clipboard.writeText(await planningText);
    return;
  }
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/plain': planningText.then((text) => new Blob([text], { type: 'text/plain' })),
    }),
  ]);
};

const byBoardName = (firstBoard: Board, secondBoard: Board) =>
  firstBoard.name.localeCompare(secondBoard.name, undefined, { sensitivity: 'base' });

const readNameForm = (submitEvent: FormEvent<HTMLFormElement>) =>
  readFormText(new FormData(submitEvent.currentTarget), 'name');

const toCardValue = (
  propertyId: string,
  cardValueInput: NonNullable<ReturnType<typeof readCardValueInput>>,
): CardPropertyValue => ({ propertyId, ...cardValueInput });

const useBoardEvents = (states: ReturnType<typeof useBoardStates>) => {
  const {
    boards,
    selectedBoardId,
    addressedCardId,
    optimisticBoard,
    renameTargetListId,
    deleteTargetListId,
    deleteTargetPropertyId,
    deleteTargetOptionId,
    openCardId,
    moveDialogListId,
    setBoards,
    setPageLoadError,
    setAddressedCardId,
    setSelectedBoardId,
    setOptimisticBoard,
    setSubmittingDialogId,
    setComposingListId,
    setRenameTargetListId,
    setDeleteTargetListId,
    setEditingPropertyId,
    setDeleteTargetPropertyId,
    setDeleteTargetOptionId,
    setOpenCardId,
    setOpenCardDetail,
    setMoveDialogListId,
    openCardDetail,
    pendingCardRename,
    setPendingCardRename,
    setCardRenameCancelCount,
  } = states;
  const router = useRouter();
  const lastWriteIdRef = useRef(0);

  const shownBoard = useMemo(
    () => (optimisticBoard === null ? null : visibleBoard(optimisticBoard)),
    [optimisticBoard],
  );

  const showBoard = useCallback(
    (boardRecord: BoardRecord) => {
      setSelectedBoardId(boardRecord.board.id);
      setOptimisticBoard(startOptimisticBoard(boardRecord));
      localStorageBoardViewSource.saveLastBoardId(boardRecord.board.id);
    },
    [setOptimisticBoard, setSelectedBoardId],
  );

  const openBoard = useCallback(
    async (boardId: string | null) => {
      setSelectedBoardId(boardId);
      setOptimisticBoard(null);
      setComposingListId(null);
      setOpenCardId(null);
      setOpenCardDetail(null);
      if (boardId === null) return;
      localStorageBoardViewSource.saveLastBoardId(boardId);
      try {
        showBoard(await findBoard(boardId));
      } catch (loadError) {
        reportAppError(loadError);
      }
    },
    [
      setComposingListId,
      setOpenCardDetail,
      setOpenCardId,
      setOptimisticBoard,
      setSelectedBoardId,
      showBoard,
    ],
  );

  const handleLoadPage = useCallback(async () => {
    setPageLoadError(null);
    try {
      const loadedBoards = await findBoards();
      setBoards(loadedBoards);
      setAddressedCardId(new URLSearchParams(window.location.search).get(CARD_QUERY_NAME));
      await openBoard(pickStartingBoardId(loadedBoards));
    } catch (pageError) {
      if (!(pageError instanceof AppError)) throw pageError;
      setPageLoadError(pageError);
    }
  }, [openBoard, setAddressedCardId, setBoards, setPageLoadError]);

  const handleSelectBoard = useCallback(
    (boardId: string) => {
      hidePopover(BOARD_SWITCHER_MENU_ID);
      if (boardId === selectedBoardId) return;
      router.replace(boardPath(boardId), { scroll: false });
      void openBoard(boardId);
    },
    [openBoard, router, selectedBoardId],
  );

  const runBoardWrite = useCallback(
    async (
      localChange: LocalBoardChange,
      sendWrite: () => Promise<BoardRecord>,
    ): Promise<boolean> => {
      lastWriteIdRef.current += 1;
      const writeId = lastWriteIdRef.current;
      setOptimisticBoard((currentBoard) =>
        currentBoard === null ? currentBoard : startBoardWrite(currentBoard, writeId, localChange),
      );
      try {
        const answeredBoard = await sendWrite();
        setOptimisticBoard((currentBoard) =>
          currentBoard === null || currentBoard.confirmedBoard.board.id !== answeredBoard.board.id
            ? currentBoard
            : confirmBoardWrite(currentBoard, writeId, answeredBoard),
        );
        return true;
      } catch (writeError) {
        setOptimisticBoard((currentBoard) =>
          currentBoard === null ? currentBoard : failBoardWrite(currentBoard, writeId),
        );
        reportAppError(writeError);
        return false;
      }
    },
    [setOptimisticBoard],
  );

  const submitDialog = useCallback(
    async (dialogId: string, saveChange: () => Promise<void>) => {
      setSubmittingDialogId(dialogId);
      try {
        await saveChange();
        hidePopover(dialogId);
        return true;
      } catch (saveError) {
        reportAppError(saveError);
        return false;
      } finally {
        setSubmittingDialogId(null);
      }
    },
    [setSubmittingDialogId],
  );

  const takeAnsweredBoard = useCallback(
    (answeredBoard: BoardRecord) =>
      setOptimisticBoard((currentBoard) =>
        currentBoard === null || currentBoard.confirmedBoard.board.id !== answeredBoard.board.id
          ? currentBoard
          : { ...currentBoard, confirmedBoard: answeredBoard },
      ),
    [setOptimisticBoard],
  );

  const handleSubmitNewBoard = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      const newBoardForm = submitEvent.currentTarget;
      const enteredName = readNameForm(submitEvent);
      await submitDialog(NEW_BOARD_DIALOG_ID, async () => {
        const createdBoard = await createBoard({ boardName: enteredName });
        setBoards((currentBoards) =>
          [...(currentBoards ?? []), createdBoard.board].sort(byBoardName),
        );
        newBoardForm.reset();
        router.replace(boardPath(createdBoard.board.id), { scroll: false });
        setComposingListId(null);
        setOpenCardId(null);
        setOpenCardDetail(null);
        showBoard(createdBoard);
      });
    },
    [
      router,
      setBoards,
      setComposingListId,
      setOpenCardDetail,
      setOpenCardId,
      showBoard,
      submitDialog,
    ],
  );

  const handleSubmitNewList = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      if (selectedBoardId === null) return;
      const newListForm = submitEvent.currentTarget;
      const enteredName = readNameForm(submitEvent);
      await submitDialog(NEW_LIST_DIALOG_ID, async () => {
        takeAnsweredBoard(
          await createBoardList({
            boardId: selectedBoardId,
            listName: enteredName,
          }),
        );
        newListForm.reset();
      });
    },
    [selectedBoardId, submitDialog, takeAnsweredBoard],
  );

  const handleSubmitBoardSettings = useCallback(
    async (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      if (shownBoard === null) return;
      const boardId = shownBoard.board.id;
      try {
        const boardName = readBoardName(readNameForm(submitEvent));
        hidePopover(BOARD_SETTINGS_DIALOG_ID);
        if (boardName === shownBoard.board.name) return;
        const isRenamed = await runBoardWrite({ kind: 'renameBoard', boardName }, () =>
          renameBoard({ boardId, boardName }),
        );
        if (!isRenamed) return;
        setBoards((currentBoards) =>
          (currentBoards ?? [])
            .map((board) => (board.id === boardId ? { ...board, name: boardName } : board))
            .sort(byBoardName),
        );
      } catch (nameError) {
        reportAppError(nameError);
      }
    },
    [runBoardWrite, setBoards, shownBoard],
  );

  const handleConfirmDeleteBoard = useCallback(async () => {
    if (selectedBoardId === null) return;
    hidePopover(DELETE_BOARD_DIALOG_ID);
    hidePopover(BOARD_SETTINGS_DIALOG_ID);
    try {
      await deleteBoard(selectedBoardId);
    } catch (deleteError) {
      reportAppError(deleteError);
      return;
    }
    const remainingBoards = (boards ?? []).filter((board) => board.id !== selectedBoardId);
    const nextBoardId = remainingBoards[0]?.id ?? null;
    setBoards(remainingBoards);
    router.replace(boardPath(nextBoardId), { scroll: false });
    await openBoard(nextBoardId);
  }, [boards, openBoard, router, selectedBoardId, setBoards]);

  const handleSubmitNewProperty = useCallback(
    async (newPropertyEntry: NewPropertyEntry) => {
      if (selectedBoardId === null) return false;
      return submitDialog(NEW_PROPERTY_DIALOG_ID, async () => {
        takeAnsweredBoard(
          await createBoardProperty({ boardId: selectedBoardId, ...newPropertyEntry }),
        );
      });
    },
    [selectedBoardId, submitDialog, takeAnsweredBoard],
  );

  const handleStartEditProperty = useCallback(
    (propertyId: string) => setEditingPropertyId(propertyId),
    [setEditingPropertyId],
  );

  const handleRenameProperty = useCallback(
    (propertyId: string, enteredName: string) => {
      try {
        const propertyName = readPropertyName(enteredName);
        void runBoardWrite({ kind: 'renameProperty', propertyId, propertyName }, () =>
          renameBoardProperty({ propertyId, propertyName }),
        );
      } catch (nameError) {
        reportAppError(nameError);
      }
    },
    [runBoardWrite],
  );

  const handleMovePropertyBy = useCallback(
    (propertyId: string, positionStep: number) => {
      const movingProperty = shownBoard?.properties.find(
        (propertyRecord) => propertyRecord.id === propertyId,
      );
      if (movingProperty === undefined || shownBoard === null) return;
      const position = movingProperty.position + positionStep;
      if (position < 0 || position >= shownBoard.properties.length) return;
      void runBoardWrite({ kind: 'moveProperty', propertyId, position }, () =>
        moveBoardProperty({ propertyId, position }),
      );
    },
    [runBoardWrite, shownBoard],
  );

  const handleStartDeleteProperty = useCallback(
    (propertyId: string) => setDeleteTargetPropertyId(propertyId),
    [setDeleteTargetPropertyId],
  );

  const handleConfirmDeleteProperty = useCallback(() => {
    if (deleteTargetPropertyId === null) return;
    hidePopover(DELETE_PROPERTY_DIALOG_ID);
    setDeleteTargetPropertyId(null);
    void runBoardWrite({ kind: 'deleteProperty', propertyId: deleteTargetPropertyId }, () =>
      deleteBoardProperty(deleteTargetPropertyId),
    );
  }, [deleteTargetPropertyId, runBoardWrite, setDeleteTargetPropertyId]);

  const handleAddOption = useCallback(
    async (propertyId: string, enteredName: string) => {
      try {
        takeAnsweredBoard(await createPropertyOption({ propertyId, optionName: enteredName }));
        return true;
      } catch (addError) {
        reportAppError(addError);
        return false;
      }
    },
    [takeAnsweredBoard],
  );

  const handleRenameOption = useCallback(
    (optionId: string, enteredName: string) => {
      try {
        const optionName = readOptionName(enteredName);
        void runBoardWrite({ kind: 'updateOption', optionId, optionName }, () =>
          updatePropertyOption({ optionId, optionName }),
        );
      } catch (nameError) {
        reportAppError(nameError);
      }
    },
    [runBoardWrite],
  );

  const handleChooseOptionColor = useCallback(
    (optionId: string, color: string | null) =>
      void runBoardWrite({ kind: 'updateOption', optionId, color }, () =>
        updatePropertyOption({ optionId, color }),
      ),
    [runBoardWrite],
  );

  const handleMoveOptionBy = useCallback(
    (optionId: string, positionStep: number) => {
      const owningProperty = shownBoard?.properties.find((propertyRecord) =>
        propertyRecord.options.some((optionRecord) => optionRecord.id === optionId),
      );
      const movingOption = owningProperty?.options.find(
        (optionRecord) => optionRecord.id === optionId,
      );
      if (owningProperty === undefined || movingOption === undefined) return;
      const position = movingOption.position + positionStep;
      if (position < 0 || position >= owningProperty.options.length) return;
      void runBoardWrite({ kind: 'moveOption', optionId, position }, () =>
        movePropertyOption({ optionId, position }),
      );
    },
    [runBoardWrite, shownBoard],
  );

  const handleStartDeleteOption = useCallback(
    (optionId: string) => setDeleteTargetOptionId(optionId),
    [setDeleteTargetOptionId],
  );

  const handleConfirmDeleteOption = useCallback(() => {
    if (deleteTargetOptionId === null) return;
    hidePopover(DELETE_OPTION_DIALOG_ID);
    setDeleteTargetOptionId(null);
    void runBoardWrite({ kind: 'deleteOption', optionId: deleteTargetOptionId }, () =>
      deletePropertyOption(deleteTargetOptionId),
    );
  }, [deleteTargetOptionId, runBoardWrite, setDeleteTargetOptionId]);

  const handleStartRenameList = useCallback(
    (listId: string) => setRenameTargetListId(listId),
    [setRenameTargetListId],
  );

  const handleSubmitRenameList = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      if (renameTargetListId === null) return;
      const enteredName = readNameForm(submitEvent);
      try {
        const listName = readListName(enteredName);
        hidePopover(RENAME_LIST_DIALOG_ID);
        void runBoardWrite({ kind: 'renameList', listId: renameTargetListId, listName }, () =>
          renameBoardList({ listId: renameTargetListId, listName }),
        );
      } catch (nameError) {
        reportAppError(nameError);
      }
    },
    [renameTargetListId, runBoardWrite],
  );

  const sendListMove = useCallback(
    (listId: string, position: number) =>
      void runBoardWrite({ kind: 'moveList', listId, position }, () =>
        moveBoardList({ listId, position }),
      ),
    [runBoardWrite],
  );

  const handleMoveListBy = useCallback(
    (listId: string, positionStep: number) => {
      const movingList = shownBoard?.lists.find((listRecord) => listRecord.id === listId);
      if (movingList === undefined || shownBoard === null) return;
      const targetPosition = movingList.position + positionStep;
      if (targetPosition < 0 || targetPosition >= shownBoard.lists.length) return;
      sendListMove(listId, targetPosition);
    },
    [sendListMove, shownBoard],
  );

  const handleDropList = useCallback(
    (draggedListId: string, targetListId: string) => {
      if (draggedListId === targetListId) return;
      const targetList = shownBoard?.lists.find((listRecord) => listRecord.id === targetListId);
      if (targetList === undefined) return;
      sendListMove(draggedListId, targetList.position);
    },
    [sendListMove, shownBoard],
  );

  const handleStartDeleteList = useCallback(
    (listId: string) => setDeleteTargetListId(listId),
    [setDeleteTargetListId],
  );

  const handleConfirmDeleteList = useCallback(() => {
    if (deleteTargetListId === null) return;
    hidePopover(DELETE_LIST_DIALOG_ID);
    setDeleteTargetListId(null);
    setComposingListId((currentListId) =>
      currentListId === deleteTargetListId ? null : currentListId,
    );
    void runBoardWrite({ kind: 'deleteList', listId: deleteTargetListId }, () =>
      deleteBoardList(deleteTargetListId),
    );
  }, [deleteTargetListId, runBoardWrite, setComposingListId, setDeleteTargetListId]);

  const handleStartComposingCard = useCallback(
    (listId: string) => setComposingListId(listId),
    [setComposingListId],
  );

  const handleCancelComposingCard = useCallback(
    () => setComposingListId(null),
    [setComposingListId],
  );

  const handleAddCard = useCallback(
    (listId: string, enteredTitle: string) => {
      try {
        const cardTitle = readCardTitle(enteredTitle);
        void runBoardWrite(
          {
            kind: 'addCard',
            cardRecord: {
              id: `${PENDING_CARD_ID_PREFIX}${lastWriteIdRef.current + 1}`,
              listId,
              position: 0,
              title: cardTitle,
              dueDate: null,
              dueTime: null,
              values: [],
              linkedTaskCount: 0,
              doneLinkedTaskCount: 0,
            },
          },
          () => createCard({ listId, cardTitle }),
        );
        return true;
      } catch (titleError) {
        reportAppError(titleError);
        return false;
      }
    },
    [runBoardWrite],
  );

  const handleOpenCard = useCallback(
    async (cardId: string) => {
      if (cardId.startsWith(PENDING_CARD_ID_PREFIX)) return;
      setOpenCardId(cardId);
      setOpenCardDetail(null);
      showPopover(CARD_DETAIL_DIALOG_ID);
      try {
        setOpenCardDetail(await findCardDetail(cardId));
      } catch (loadError) {
        reportAppError(loadError);
      }
    },
    [setOpenCardDetail, setOpenCardId],
  );

  const handleOpenAddressedCard = useCallback(() => {
    if (addressedCardId === null || shownBoard === null) return;
    setAddressedCardId(null);
    router.replace(boardPath(shownBoard.board.id), { scroll: false });
    if (shownBoard.cards.some((cardRecord) => cardRecord.id === addressedCardId)) {
      void handleOpenCard(addressedCardId);
    }
  }, [addressedCardId, handleOpenCard, router, setAddressedCardId, shownBoard]);

  const handleCopyListForPlanning = useCallback(async (listId: string) => {
    const planningText = findListForPlanning(listId);
    const exportError = planningText.then(
      () => null,
      (failedExportError: unknown) => failedExportError,
    );
    try {
      await writePlanningText(planningText);
      toast.success('List copied', { description: 'Paste it into your daily planning.' });
    } catch {
      const failedExportError = await exportError;
      if (failedExportError !== null) {
        reportAppError(failedExportError);
        return;
      }
      toast.error('Couldn’t copy', {
        description: 'Your browser blocked the clipboard. Try again.',
      });
    }
  }, []);

  const saveCardTitle = useCallback(
    (cardId: string, cardTitle: string, renameEvents: boolean) =>
      void runBoardWrite({ kind: 'updateCard', cardId, title: cardTitle }, () =>
        renameCard({ cardId, cardTitle, renameEvents }),
      ),
    [runBoardWrite],
  );

  const handleRenameCard = useCallback(
    (cardId: string, enteredTitle: string, isCardRunning: boolean) => {
      try {
        const cardTitle = readCardTitle(enteredTitle);
        const previousTitle = shownBoard?.cards.find(
          (cardRecord) => cardRecord.id === cardId,
        )?.title;
        const eventCount =
          openCardDetail?.card.id === cardId
            ? trackedEventCountOf(openCardDetail.trackedEventCount, isCardRunning)
            : 0;
        if (previousTitle !== undefined && eventCount > 0) {
          setPendingCardRename({
            cardId,
            cardTitle,
            renameRequest: { eventCount, previousName: previousTitle, nextName: cardTitle },
          });
          showPopover(RENAME_CARD_EVENTS_DIALOG_ID);
          return;
        }
        saveCardTitle(cardId, cardTitle, false);
      } catch (titleError) {
        reportAppError(titleError);
      }
    },
    [openCardDetail, saveCardTitle, setPendingCardRename, shownBoard],
  );

  const handleAnswerCardRename = useCallback(
    (renameAnswer: RenameEventsAnswer) => {
      setPendingCardRename(null);
      if (pendingCardRename === null) return;
      if (renameAnswer === 'cancel') {
        setCardRenameCancelCount((cancelCount) => cancelCount + 1);
        return;
      }
      saveCardTitle(
        pendingCardRename.cardId,
        pendingCardRename.cardTitle,
        renameAnswer === 'rename-all',
      );
    },
    [pendingCardRename, saveCardTitle, setCardRenameCancelCount, setPendingCardRename],
  );

  const handleEnterCardValue = useCallback(
    (cardId: string, propertyId: string, enteredValue: string) => {
      const valueProperty = shownBoard?.properties.find(
        (propertyRecord) => propertyRecord.id === propertyId,
      );
      const valueCard = shownBoard?.cards.find((cardRecord) => cardRecord.id === cardId);
      if (valueProperty === undefined || valueCard === undefined) return false;
      try {
        const cardValueInput = readCardValueInput(valueProperty.kind, enteredValue);
        if (cardValueInput !== null) {
          void runBoardWrite(
            { kind: 'setValue', cardId, cardValue: toCardValue(propertyId, cardValueInput) },
            () => setCardValue({ cardId, propertyId, cardValueInput }),
          );
          return true;
        }
        const hasValue = valueCard.values.some((cardValue) => cardValue.propertyId === propertyId);
        if (hasValue) {
          void runBoardWrite({ kind: 'clearValue', cardId, propertyId }, () =>
            clearCardValue({ cardId, propertyId }),
          );
        }
        return true;
      } catch (valueError) {
        reportAppError(valueError);
        return false;
      }
    },
    [runBoardWrite, shownBoard],
  );

  const handleChangeCardDue = useCallback(
    (cardId: string, dueDate: string | null, dueTime: string | null) => {
      const keptDueTime = dueDate === null ? null : dueTime;
      void runBoardWrite({ kind: 'updateCard', cardId, dueDate, dueTime: keptDueTime }, () =>
        updateCardDue({ cardId, dueDate, dueTime: keptDueTime }),
      );
    },
    [runBoardWrite],
  );

  const handleSaveCardNotes = useCallback(
    async (cardId: string, notes: string) => {
      try {
        await updateCardNotes({ cardId, notes });
        setOpenCardDetail((currentDetail) =>
          currentDetail?.card.id === cardId ? { ...currentDetail, notes } : currentDetail,
        );
        return true;
      } catch (saveError) {
        reportAppError(saveError);
        return false;
      }
    },
    [setOpenCardDetail],
  );

  const sendCardMove = useCallback(
    (cardId: string, listId: string, position: number) =>
      void runBoardWrite({ kind: 'moveCard', cardId, listId, position }, () =>
        moveCard({ cardId, moveTarget: { listId, position } }),
      ),
    [runBoardWrite],
  );

  const handleDropCard = useCallback(
    (draggedCardId: string, listId: string, position: number) => {
      if (draggedCardId.startsWith(PENDING_CARD_ID_PREFIX)) return;
      const draggedCard = shownBoard?.cards.find((cardRecord) => cardRecord.id === draggedCardId);
      if (draggedCard === undefined) return;
      const isSameList = draggedCard.listId === listId;
      const landingPosition =
        isSameList && draggedCard.position < position ? position - 1 : position;
      if (isSameList && draggedCard.position === landingPosition) return;
      sendCardMove(draggedCardId, listId, landingPosition);
    },
    [sendCardMove, shownBoard],
  );

  const handleOpenMoveCard = useCallback(() => {
    const openCard = shownBoard?.cards.find((cardRecord) => cardRecord.id === openCardId);
    if (openCard === undefined) return;
    setMoveDialogListId(openCard.listId);
  }, [openCardId, setMoveDialogListId, shownBoard]);

  const handleChooseMoveList = useCallback(
    (listId: string) => setMoveDialogListId(listId),
    [setMoveDialogListId],
  );

  const handleSubmitMoveCard = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      if (openCardId === null || moveDialogListId === null) return;
      const chosenPosition = Number(
        readFormText(new FormData(submitEvent.currentTarget), 'move-position'),
      );
      hidePopover(MOVE_CARD_DIALOG_ID);
      sendCardMove(
        openCardId,
        moveDialogListId,
        Number.isInteger(chosenPosition) ? chosenPosition : 0,
      );
    },
    [moveDialogListId, openCardId, sendCardMove],
  );

  const handleConfirmDeleteCard = useCallback(() => {
    if (openCardId === null) return;
    hidePopover(DELETE_CARD_DIALOG_ID);
    hidePopover(CARD_DETAIL_DIALOG_ID);
    setOpenCardId(null);
    setOpenCardDetail(null);
    void runBoardWrite({ kind: 'deleteCard', cardId: openCardId }, () => deleteCard(openCardId));
  }, [openCardId, runBoardWrite, setOpenCardDetail, setOpenCardId]);

  return {
    shownBoard,
    handleLoadPage,
    handleSelectBoard,
    handleSubmitNewBoard,
    handleSubmitNewList,
    handleSubmitBoardSettings,
    handleConfirmDeleteBoard,
    handleSubmitNewProperty,
    handleStartEditProperty,
    handleRenameProperty,
    handleMovePropertyBy,
    handleStartDeleteProperty,
    handleConfirmDeleteProperty,
    handleAddOption,
    handleRenameOption,
    handleChooseOptionColor,
    handleMoveOptionBy,
    handleStartDeleteOption,
    handleConfirmDeleteOption,
    handleStartRenameList,
    handleSubmitRenameList,
    handleMoveListBy,
    handleDropList,
    handleStartDeleteList,
    handleConfirmDeleteList,
    handleStartComposingCard,
    handleCancelComposingCard,
    handleAddCard,
    handleOpenCard,
    handleOpenAddressedCard,
    handleCopyListForPlanning,
    handleRenameCard,
    handleAnswerCardRename,
    handleEnterCardValue,
    handleChangeCardDue,
    handleSaveCardNotes,
    handleDropCard,
    handleOpenMoveCard,
    handleChooseMoveList,
    handleSubmitMoveCard,
    handleConfirmDeleteCard,
  };
};

export default useBoardEvents;
