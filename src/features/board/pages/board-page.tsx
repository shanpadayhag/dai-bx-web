'use client';

import {
  Archive,
  Columns3,
  LayoutGrid,
  Pencil,
  Plus,
  RotateCw,
  Settings2,
  WifiOff,
} from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import EmptyState from '@/core/components/molecules/empty-state';
import PageHeader from '@/core/components/molecules/page-header';
import ArchivedCardsDialog from '@/features/board/components/archived-cards-dialog';
import BoardColumn from '@/features/board/components/board-column';
import BoardColumnsSettings from '@/features/board/components/board-columns-settings';
import BoardNameDialog from '@/features/board/components/board-name-dialog';
import BoardSettingsDialog from '@/features/board/components/board-settings-dialog';
import BoardSwitcher from '@/features/board/components/board-switcher';
import CardDetailDialog from '@/features/board/components/card-detail-dialog';
import CardHistorySection from '@/features/board/components/card-history-section';
import CardScheduleSection from '@/features/board/components/card-schedule-section';
import CardWorkflowSection from '@/features/board/components/card-workflow-section';
import ConfirmDeleteDialog from '@/features/board/components/confirm-delete-dialog';
import MoveCardDialog from '@/features/board/components/move-card-dialog';
import NewPropertyDialog from '@/features/board/components/new-property-dialog';
import NoBoardsState from '@/features/board/components/no-boards-state';
import NoListsState from '@/features/board/components/no-lists-state';
import PropertyFormDialog from '@/features/board/components/property-form-dialog';
import { arrangeBoard, arrangeCardDetail } from '@/features/board/entities/board-arrangement';
import { cardArchiveFromRecord } from '@/features/board/entities/card-archive';
import {
  describeBoardDeletion,
  describeCardDeletion,
  describeListDeletion,
  describePropertyUseDeletion,
} from '@/features/board/entities/delete-summary';
import useBoardEvents, {
  ARCHIVED_CARDS_DIALOG_ID,
  BOARD_SETTINGS_DIALOG_ID,
  BOARD_SWITCHER_MENU_ID,
  CARD_DETAIL_DIALOG_ID,
  DELETE_ARCHIVED_CARD_DIALOG_ID,
  DELETE_BOARD_DIALOG_ID,
  DELETE_CARD_DIALOG_ID,
  DELETE_LIST_DIALOG_ID,
  DELETE_OPTION_DIALOG_ID,
  DELETE_PROPERTY_DIALOG_ID,
  MOVE_CARD_DIALOG_ID,
  NEW_BOARD_DIALOG_ID,
  NEW_LIST_DIALOG_ID,
  NEW_PROPERTY_DIALOG_ID,
  PENDING_CARD_ID_PREFIX,
  PROPERTY_FORM_DIALOG_ID,
  RENAME_CARD_EVENTS_DIALOG_ID,
  RENAME_LIST_DIALOG_ID,
  SCHEDULE_FORM_DIALOG_ID,
} from '@/features/board/events/use-board-events';
import {
  countCardsUsingOption,
  countCardsUsingProperty,
} from '@/features/board/entities/property-use';
import useBoardStates from '@/features/board/states/use-board-states';
import { RUNNING_LIST_ID } from '@/features/tracking/events/use-tracking-events';
import { useTracking } from '@/features/tracking/states/tracking-context';

const isPendingCard = (cardId: string) => cardId.startsWith(PENDING_CARD_ID_PREFIX);

const BoardPage = () => {
  const states = useBoardStates();
  const events = useBoardEvents(states);
  const { handleLoadPage, handleOpenAddressedCard, shownBoard } = events;
  const { runningSourceIds, calendarTimeZone, handleStartCard, trackingRevision } = useTracking();
  const { handleReloadAfterTracking } = events;
  const shownTrackingRevisionRef = useRef(trackingRevision);

  useEffect(() => {
    void handleLoadPage();
  }, [handleLoadPage]);

  useEffect(() => {
    handleOpenAddressedCard();
  }, [handleOpenAddressedCard]);

  useEffect(() => {
    if (shownTrackingRevisionRef.current === trackingRevision) return;
    shownTrackingRevisionRef.current = trackingRevision;
    void handleReloadAfterTracking();
  }, [handleReloadAfterTracking, trackingRevision]);

  const boardContents = useMemo(
    () => (shownBoard === null ? null : arrangeBoard(shownBoard)),
    [shownBoard],
  );

  const newBoardDialog = (
    <BoardNameDialog
      dialogId={NEW_BOARD_DIALOG_ID}
      icon={<LayoutGrid />}
      title="New board"
      description="It starts empty. Add the lists you want, like Backlog, Doing and Done."
      nameLabel="Name"
      namePlaceholder="Like Personal or Work"
      initialName=""
      submitLabel="Create board"
      submittingLabel="Creating…"
      isSubmitting={states.submittingDialogId === NEW_BOARD_DIALOG_ID}
      onSubmit={(submitEvent) => void events.handleSubmitNewBoard(submitEvent)}
    />
  );

  if (states.boards === null) {
    return (
      <div className="grid gap-6">
        {states.pageLoadError === null ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading your boards…
          </p>
        ) : (
          <EmptyState
            icon={<WifiOff />}
            title={states.pageLoadError.title}
            description={states.pageLoadError.description}
            action={
              <Button variant="secondary" onClick={() => void handleLoadPage()}>
                <RotateCw />
                Try again
              </Button>
            }
          />
        )}
      </div>
    );
  }

  if (states.boards.length === 0) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Board" />
        <NoBoardsState newBoardDialogId={NEW_BOARD_DIALOG_ID} />
        {newBoardDialog}
      </div>
    );
  }

  if (boardContents === null || shownBoard === null) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Board" />
        <p role="status" className="text-sm text-muted-foreground">
          Loading the board…
        </p>
        {newBoardDialog}
      </div>
    );
  }

  const { board, lists, properties } = boardContents;
  const now = new Date();
  const cardCount = shownBoard.cards.length;
  const renameTargetList = lists.find((boardList) => boardList.id === states.renameTargetListId);
  const deleteTargetList = lists.find((boardList) => boardList.id === states.deleteTargetListId);
  const isOpenCardDetailLoaded = states.openCardDetail?.card.id === states.openCardId;
  const openCardArchiveRecord = isOpenCardDetailLoaded
    ? (states.openCardDetail?.archived ?? null)
    : null;
  const openCardRecord =
    shownBoard.cards.find((cardRecord) => cardRecord.id === states.openCardId) ??
    (openCardArchiveRecord === null ? undefined : states.openCardDetail?.card);
  const openCardDetail =
    openCardRecord === undefined
      ? null
      : arrangeCardDetail(
          {
            card: openCardRecord,
            notes: isOpenCardDetailLoaded ? (states.openCardDetail?.notes ?? '') : '',
            linkedTasks: isOpenCardDetailLoaded ? (states.openCardDetail?.linkedTasks ?? []) : [],
          },
          shownBoard,
        );
  const editingProperty =
    properties.find((property) => property.id === states.editingPropertyId) ?? null;
  const deleteTargetProperty = properties.find(
    (property) => property.id === states.deleteTargetPropertyId,
  );
  const deleteTargetOption = properties
    .flatMap((property) => property.options)
    .find((option) => option.id === states.deleteTargetOptionId);
  const openCardArchive =
    openCardArchiveRecord === null ? null : cardArchiveFromRecord(openCardArchiveRecord);
  const deleteTargetArchivedCard = states.archivedCardsPage?.cards.find(
    (archivedCard) => archivedCard.id === states.deleteTargetArchivedCardId,
  );

  return (
    <div className="grid min-h-0 grid-cols-[minmax(0,1fr)] gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <h1 className="sr-only">Board</h1>
          <BoardSwitcher
            menuId={BOARD_SWITCHER_MENU_ID}
            boards={states.boards}
            currentBoard={board}
            newBoardDialogId={NEW_BOARD_DIALOG_ID}
            onSelectBoard={events.handleSelectBoard}
          />
          <IconButton label="Board settings" popoverTarget={BOARD_SETTINGS_DIALOG_ID}>
            <Settings2 />
          </IconButton>
          <Button
            variant="ghost"
            size="sm"
            popoverTarget={ARCHIVED_CARDS_DIALOG_ID}
            onClick={events.handleOpenArchivedCards}
          >
            <Archive />
            Archived
          </Button>
        </div>
        {lists.length > 0 ? (
          <Button popoverTarget={NEW_LIST_DIALOG_ID}>
            <Plus />
            New list
          </Button>
        ) : null}
      </header>
      {lists.length === 0 ? (
        <NoListsState newListDialogId={NEW_LIST_DIALOG_ID} />
      ) : (
        <div className="relative -mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:snap-none sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex w-max items-start gap-3">
            {lists.map((boardList, listIndex) => (
              <BoardColumn
                key={boardList.id}
                boardList={boardList}
                properties={properties}
                isFirstList={listIndex === 0}
                isLastList={listIndex === lists.length - 1}
                isComposing={boardList.id === states.composingListId}
                renameListDialogId={RENAME_LIST_DIALOG_ID}
                deleteListDialogId={DELETE_LIST_DIALOG_ID}
                now={now}
                isPendingCard={isPendingCard}
                onStartComposing={events.handleStartComposingCard}
                onCancelComposing={events.handleCancelComposingCard}
                onAddCard={events.handleAddCard}
                onOpenCard={(cardId) => void events.handleOpenCard(cardId)}
                onDropCard={events.handleDropCard}
                onDropList={events.handleDropList}
                onRenameList={events.handleStartRenameList}
                onMoveListBy={events.handleMoveListBy}
                onDeleteList={events.handleStartDeleteList}
                onCopyListForPlanning={(listId) => void events.handleCopyListForPlanning(listId)}
                calendarTimeZone={calendarTimeZone}
                archiveAfter={boardList.archiveAfter}
              />
            ))}
            <button
              type="button"
              popoverTarget={NEW_LIST_DIALOG_ID}
              className="flex h-11 w-[272px] shrink-0 snap-start items-center gap-2 rounded-2xl border border-dashed border-border-strong px-4 text-sm text-muted-foreground transition-colors duration-150 hover:border-primary/50 hover:text-foreground"
            >
              <Plus className="size-4" />
              Add another list
            </button>
          </div>
        </div>
      )}
      {newBoardDialog}
      <BoardNameDialog
        dialogId={NEW_LIST_DIALOG_ID}
        icon={<Columns3 />}
        title="New list"
        description="It goes at the end of the board. You can move it later."
        nameLabel="Name"
        namePlaceholder="Like Backlog or Doing"
        initialName=""
        submitLabel="Add list"
        submittingLabel="Adding…"
        isSubmitting={states.submittingDialogId === NEW_LIST_DIALOG_ID}
        onSubmit={(submitEvent) => void events.handleSubmitNewList(submitEvent)}
      />
      <BoardNameDialog
        dialogId={RENAME_LIST_DIALOG_ID}
        icon={<Pencil />}
        title="Rename list"
        description="Its cards stay where they are."
        nameLabel="Name"
        namePlaceholder="Like Backlog or Doing"
        initialName={renameTargetList?.name ?? ''}
        submitLabel="Save name"
        onSubmit={events.handleSubmitRenameList}
      />
      <ConfirmDeleteDialog
        dialogId={DELETE_LIST_DIALOG_ID}
        title={`Delete the “${deleteTargetList?.name ?? 'this'}” list?`}
        description={describeListDeletion(deleteTargetList?.cards.length ?? 0)}
        confirmLabel="Delete list and cards"
        onConfirm={events.handleConfirmDeleteList}
      />
      <BoardSettingsDialog
        dialogId={BOARD_SETTINGS_DIALOG_ID}
        board={board}
        properties={properties}
        newPropertyDialogId={NEW_PROPERTY_DIALOG_ID}
        propertyFormDialogId={PROPERTY_FORM_DIALOG_ID}
        deletePropertyDialogId={DELETE_PROPERTY_DIALOG_ID}
        deleteBoardDialogId={DELETE_BOARD_DIALOG_ID}
        onSubmit={(submitEvent) => void events.handleSubmitBoardSettings(submitEvent)}
        onStartEditProperty={events.handleStartEditProperty}
        onMovePropertyBy={events.handleMovePropertyBy}
        onStartDeleteProperty={events.handleStartDeleteProperty}
        columnsSection={
          <BoardColumnsSettings
            headingId={`${BOARD_SETTINGS_DIALOG_ID}-columns`}
            lists={lists}
            onSaveArchiveAfter={events.handleSaveArchiveAfter}
          />
        }
      />
      <ArchivedCardsDialog
        dialogId={ARCHIVED_CARDS_DIALOG_ID}
        deleteDialogId={DELETE_ARCHIVED_CARD_DIALOG_ID}
        boardName={board.name}
        archivedCards={states.archivedCardsPage?.cards ?? null}
        hasOlderCards={states.archivedCardsPage?.hasOlderCards ?? false}
        calendarTimeZone={calendarTimeZone}
        onRestoreCard={(cardId) => void events.handleRestoreArchivedCard(cardId)}
        onStartDeleteCard={events.handleStartDeleteArchivedCard}
        onLoadOlderCards={events.handleLoadOlderArchivedCards}
      />
      <ConfirmDeleteDialog
        dialogId={DELETE_ARCHIVED_CARD_DIALOG_ID}
        title={`Delete “${deleteTargetArchivedCard?.title ?? 'this archived card'}”?`}
        description={describeCardDeletion(0)}
        confirmLabel="Delete card"
        onConfirm={() => void events.handleConfirmDeleteArchivedCard()}
      />
      <ConfirmDeleteDialog
        dialogId={DELETE_BOARD_DIALOG_ID}
        title={`Delete the “${board.name}” board?`}
        description={describeBoardDeletion(lists.length, cardCount)}
        confirmLabel="Delete board"
        onConfirm={() => void events.handleConfirmDeleteBoard()}
      />
      <NewPropertyDialog
        dialogId={NEW_PROPERTY_DIALOG_ID}
        isSubmitting={states.submittingDialogId === NEW_PROPERTY_DIALOG_ID}
        onSubmit={events.handleSubmitNewProperty}
      />
      <PropertyFormDialog
        dialogId={PROPERTY_FORM_DIALOG_ID}
        property={editingProperty}
        deleteOptionDialogId={DELETE_OPTION_DIALOG_ID}
        onRenameProperty={events.handleRenameProperty}
        onAddOption={events.handleAddOption}
        onRenameOption={events.handleRenameOption}
        onChooseOptionColor={events.handleChooseOptionColor}
        onMoveOptionBy={events.handleMoveOptionBy}
        onStartDeleteOption={events.handleStartDeleteOption}
      />
      <ConfirmDeleteDialog
        dialogId={DELETE_PROPERTY_DIALOG_ID}
        title={`Delete the “${deleteTargetProperty?.name ?? 'this'}” property?`}
        description={describePropertyUseDeletion(
          deleteTargetProperty === undefined
            ? 0
            : countCardsUsingProperty(shownBoard.cards, deleteTargetProperty.id),
        )}
        confirmLabel="Delete property"
        onConfirm={events.handleConfirmDeleteProperty}
      />
      <ConfirmDeleteDialog
        dialogId={DELETE_OPTION_DIALOG_ID}
        title={`Delete the “${deleteTargetOption?.name ?? 'this'}” option?`}
        description={describePropertyUseDeletion(
          deleteTargetOption === undefined
            ? 0
            : countCardsUsingOption(shownBoard.cards, deleteTargetOption.id),
        )}
        confirmLabel="Delete option"
        onConfirm={events.handleConfirmDeleteOption}
      />
      <CardDetailDialog
        dialogId={CARD_DETAIL_DIALOG_ID}
        board={board}
        properties={properties}
        cardDetail={openCardDetail}
        areDetailsLoading={!isOpenCardDetailLoaded}
        moveCardDialogId={MOVE_CARD_DIALOG_ID}
        deleteCardDialogId={DELETE_CARD_DIALOG_ID}
        now={now}
        onRenameCard={(cardId, cardTitle) =>
          events.handleRenameCard(cardId, cardTitle, runningSourceIds.has(cardId))
        }
        onEnterValue={events.handleEnterCardValue}
        onChangeDue={events.handleChangeCardDue}
        onSaveNotes={events.handleSaveCardNotes}
        onOpenMoveCard={events.handleOpenMoveCard}
        isCardRunning={openCardDetail !== null && runningSourceIds.has(openCardDetail.card.id)}
        runningListId={RUNNING_LIST_ID}
        onStartCard={handleStartCard}
        renameEventsDialogId={RENAME_CARD_EVENTS_DIALOG_ID}
        renameRequest={states.pendingCardRename?.renameRequest ?? null}
        titleResetCount={states.cardRenameCancelCount}
        onAnswerRename={events.handleAnswerCardRename}
        cardArchive={openCardArchive}
        calendarTimeZone={calendarTimeZone}
        onSetArchived={(cardId, isArchived) =>
          void events.handleSetCardArchived(cardId, isArchived)
        }
        workflowSection={
          openCardDetail === null ? null : (
            <CardWorkflowSection
              key={`workflow-${openCardDetail.card.id}`}
              triggers={states.openCardTriggers}
              lists={lists}
              onChangeTrigger={(triggerKind, listId) =>
                void events.handleChangeTrigger(triggerKind, listId)
              }
            />
          )
        }
        historySection={
          openCardDetail === null ? null : (
            <CardHistorySection
              key={`history-${openCardDetail.card.id}`}
              historyPage={states.cardHistoryPage}
              calendarTimeZone={calendarTimeZone}
              onLoadHistory={(olderThanMoveId) => void events.handleLoadHistory(olderThanMoveId)}
            />
          )
        }
        scheduleSection={
          openCardDetail === null ? null : (
            <CardScheduleSection
              key={openCardDetail.card.id}
              formDialogId={SCHEDULE_FORM_DIALOG_ID}
              cardTitle={openCardDetail.card.title}
              schedules={states.openCardSchedules}
              runsPages={states.scheduleRunsPages}
              lists={lists}
              categories={states.scheduleCategories ?? []}
              calendarTimeZone={calendarTimeZone}
              now={now}
              isSubmitting={states.submittingDialogId === SCHEDULE_FORM_DIALOG_ID}
              onSubmitSchedule={(scheduleId, submitEvent) =>
                void events.handleSubmitSchedule(scheduleId, submitEvent)
              }
              onSetPaused={(scheduleId, isPaused) =>
                void events.handleSetSchedulePaused(scheduleId, isPaused)
              }
              onRunNow={(scheduleId) => void events.handleRunScheduleNow(scheduleId)}
              onDelete={(scheduleId) => void events.handleDeleteSchedule(scheduleId)}
              onLoadRuns={(scheduleId, olderThan) =>
                void events.handleLoadScheduleRuns(scheduleId, olderThan)
              }
            />
          )
        }
      />
      <MoveCardDialog
        key={states.openCardId ?? 'none'}
        dialogId={MOVE_CARD_DIALOG_ID}
        card={openCardDetail?.card ?? null}
        lists={lists}
        chosenListId={states.moveDialogListId}
        onChooseList={events.handleChooseMoveList}
        onSubmit={events.handleSubmitMoveCard}
      />
      <ConfirmDeleteDialog
        dialogId={DELETE_CARD_DIALOG_ID}
        title={`Delete “${openCardDetail?.card.title ?? 'this card'}”?`}
        description={describeCardDeletion(openCardDetail?.card.linkedTaskCount ?? 0)}
        confirmLabel="Delete card"
        onConfirm={events.handleConfirmDeleteCard}
      />
    </div>
  );
};

export default BoardPage;
