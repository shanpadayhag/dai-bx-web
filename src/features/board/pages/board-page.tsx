import { Columns3, LayoutGrid, Pencil, Plus, Settings2 } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import PageHeader from '@/core/components/molecules/page-header';
import BoardColumn from '@/features/board/components/board-column';
import BoardNameDialog from '@/features/board/components/board-name-dialog';
import BoardSettingsDialog from '@/features/board/components/board-settings-dialog';
import BoardSwitcher from '@/features/board/components/board-switcher';
import CardDetailDialog from '@/features/board/components/card-detail-dialog';
import ConfirmDeleteDialog from '@/features/board/components/confirm-delete-dialog';
import MoveCardDialog from '@/features/board/components/move-card-dialog';
import NoBoardsState from '@/features/board/components/no-boards-state';
import NoListsState from '@/features/board/components/no-lists-state';
import PropertyFormDialog from '@/features/board/components/property-form-dialog';
import sampleBoardSource from '@/features/board/data_sources/sample/board-source';
import {
  describeBoardDeletion,
  describeCardDeletion,
  describeListDeletion,
  describePropertyUseDeletion,
} from '@/features/board/entities/delete-summary';

const NEW_BOARD_DIALOG_ID = 'new-board-dialog';
const NEW_LIST_DIALOG_ID = 'new-list-dialog';
const RENAME_LIST_DIALOG_ID = 'rename-list-dialog';
const DELETE_LIST_DIALOG_ID = 'delete-list-dialog';
const BOARD_SETTINGS_DIALOG_ID = 'board-settings-dialog';
const DELETE_BOARD_DIALOG_ID = 'delete-board-dialog';
const PROPERTY_FORM_DIALOG_ID = 'property-form-dialog';
const DELETE_PROPERTY_DIALOG_ID = 'delete-property-dialog';
const DELETE_OPTION_DIALOG_ID = 'delete-option-dialog';
const CARD_DETAIL_DIALOG_ID = 'card-detail-dialog';
const MOVE_CARD_DIALOG_ID = 'move-card-dialog';
const DELETE_CARD_DIALOG_ID = 'delete-card-dialog';

type BoardPageProps = {
  boardId: string | undefined;
  hasNoBoards: boolean;
};

const NewBoardDialog = () => (
  <BoardNameDialog
    dialogId={NEW_BOARD_DIALOG_ID}
    icon={<LayoutGrid />}
    title="New board"
    description="It starts empty. Add the lists you want, like Backlog, Doing and Done."
    nameLabel="Name"
    namePlaceholder="Like Personal or Work"
    initialName=""
    submitLabel="Create board"
  />
);

const BoardPage = ({ boardId, hasNoBoards }: BoardPageProps) => {
  if (hasNoBoards) {
    return (
      <div className="grid gap-6">
        <PageHeader title="Board" />
        <NoBoardsState newBoardDialogId={NEW_BOARD_DIALOG_ID} />
        <NewBoardDialog />
      </div>
    );
  }

  const boards = sampleBoardSource.findBoards();
  const boardContents = sampleBoardSource.findBoardContents(boardId);
  const cardDetail = sampleBoardSource.findCardDetail();
  if (boardContents === undefined) return null;

  const { board, lists, properties } = boardContents;
  const now = new Date();
  const cardCount = lists.reduce(
    (runningCardCount, boardList) => runningCardCount + boardList.cards.length,
    0,
  );
  const doingList = lists.find((boardList) => boardList.id === 'doing');
  const projectProperty = properties[0];

  return (
    <div className="grid min-h-0 grid-cols-[minmax(0,1fr)] gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <h1 className="sr-only">Board</h1>
          <BoardSwitcher
            boards={boards}
            currentBoard={board}
            newBoardDialogId={NEW_BOARD_DIALOG_ID}
          />
          <IconButton label="Board settings" popoverTarget={BOARD_SETTINGS_DIALOG_ID}>
            <Settings2 />
          </IconButton>
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
                isComposing={boardList.id === 'backlog'}
                cardDetailDialogId={CARD_DETAIL_DIALOG_ID}
                renameListDialogId={RENAME_LIST_DIALOG_ID}
                deleteListDialogId={DELETE_LIST_DIALOG_ID}
                now={now}
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
      <NewBoardDialog />
      <BoardNameDialog
        dialogId={NEW_LIST_DIALOG_ID}
        icon={<Columns3 />}
        title="New list"
        description="It goes at the end of the board. You can move it later."
        nameLabel="Name"
        namePlaceholder="Like Backlog or Doing"
        initialName=""
        submitLabel="Add list"
      />
      <BoardNameDialog
        dialogId={RENAME_LIST_DIALOG_ID}
        icon={<Pencil />}
        title="Rename list"
        description="Its cards stay where they are."
        nameLabel="Name"
        namePlaceholder="Like Backlog or Doing"
        initialName={doingList?.name ?? ''}
        submitLabel="Save name"
      />
      <ConfirmDeleteDialog
        dialogId={DELETE_LIST_DIALOG_ID}
        title={`Delete the “${doingList?.name ?? 'this'}” list?`}
        description={describeListDeletion(doingList?.cards.length ?? 0)}
        confirmLabel="Delete list and cards"
      />
      <BoardSettingsDialog
        dialogId={BOARD_SETTINGS_DIALOG_ID}
        board={board}
        properties={properties}
        propertyFormDialogId={PROPERTY_FORM_DIALOG_ID}
        deletePropertyDialogId={DELETE_PROPERTY_DIALOG_ID}
        deleteBoardDialogId={DELETE_BOARD_DIALOG_ID}
      />
      <ConfirmDeleteDialog
        dialogId={DELETE_BOARD_DIALOG_ID}
        title={`Delete the “${board.name}” board?`}
        description={describeBoardDeletion(lists.length, cardCount)}
        confirmLabel="Delete board"
      />
      {projectProperty === undefined ? null : (
        <>
          <PropertyFormDialog
            dialogId={PROPERTY_FORM_DIALOG_ID}
            property={projectProperty}
            deleteOptionDialogId={DELETE_OPTION_DIALOG_ID}
          />
          <ConfirmDeleteDialog
            dialogId={DELETE_PROPERTY_DIALOG_ID}
            title={`Delete the “${projectProperty.name}” property?`}
            description={describePropertyUseDeletion(7)}
            confirmLabel="Delete property"
          />
          <ConfirmDeleteDialog
            dialogId={DELETE_OPTION_DIALOG_ID}
            title="Delete the “Trading” option?"
            description={describePropertyUseDeletion(2)}
            confirmLabel="Delete option"
          />
        </>
      )}
      <CardDetailDialog
        dialogId={CARD_DETAIL_DIALOG_ID}
        board={board}
        properties={properties}
        cardDetail={cardDetail}
        moveCardDialogId={MOVE_CARD_DIALOG_ID}
        deleteCardDialogId={DELETE_CARD_DIALOG_ID}
        now={now}
      />
      <MoveCardDialog
        dialogId={MOVE_CARD_DIALOG_ID}
        card={cardDetail.card}
        lists={lists}
        chosenListId="done"
      />
      <ConfirmDeleteDialog
        dialogId={DELETE_CARD_DIALOG_ID}
        title={`Delete “${cardDetail.card.title}”?`}
        description={describeCardDeletion(cardDetail.linkedTasks.length)}
        confirmLabel="Delete card"
      />
    </div>
  );
};

export default BoardPage;
