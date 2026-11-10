import { Archive, GripVertical, MoreHorizontal, Plus } from 'lucide-react';
import { useState } from 'react';
import joinClassNames from '@/core/class-names';
import IconButton from '@/core/components/atoms/icon-button';
import BoardCardTile from '@/features/board/components/board-card-tile';
import {
  DRAGGED_CARD_DATA_TYPE,
  DRAGGED_LIST_DATA_TYPE,
  isDragCarrying,
  isLeavingElement,
} from '@/features/board/components/board-drag';
import CardComposer from '@/features/board/components/card-composer';
import ListActionsMenu from '@/features/board/components/list-actions-menu';
import type BoardList from '@/features/board/entities/board-list';
import type BoardProperty from '@/features/board/entities/board-property';

type BoardColumnProps = {
  boardList: BoardList;
  properties: readonly BoardProperty[];
  isFirstList: boolean;
  isLastList: boolean;
  isComposing: boolean;
  renameListDialogId: string;
  deleteListDialogId: string;
  now: Date;
  isPendingCard: (cardId: string) => boolean;
  onStartComposing: (listId: string) => void;
  onCancelComposing: () => void;
  onAddCard: (listId: string, cardTitle: string) => boolean;
  onOpenCard: (cardId: string) => void;
  onDropCard: (draggedCardId: string, listId: string, position: number) => void;
  onDropList: (draggedListId: string, targetListId: string) => void;
  onRenameList: (listId: string) => void;
  onMoveListBy: (listId: string, positionStep: number) => void;
  onDeleteList: (listId: string) => void;
  onCopyListForPlanning: (listId: string) => void;
  calendarTimeZone: string;
  archiveAfter: string | null;
};

const BoardColumn = ({
  boardList,
  properties,
  isFirstList,
  isLastList,
  isComposing,
  renameListDialogId,
  deleteListDialogId,
  now,
  isPendingCard,
  onStartComposing,
  onCancelComposing,
  onAddCard,
  onOpenCard,
  onDropCard,
  onDropList,
  onRenameList,
  onMoveListBy,
  onDeleteList,
  onCopyListForPlanning,
  calendarTimeZone,
  archiveAfter,
}: BoardColumnProps) => {
  const [dropKind, setDropKind] = useState<'card' | 'list' | null>(null);
  const listMenuId = `list-actions-menu-${boardList.id}`;

  return (
    <section
      aria-label={boardList.name}
      onDragOver={(dragEvent) => {
        const carriedKind = isDragCarrying(dragEvent, DRAGGED_CARD_DATA_TYPE)
          ? 'card'
          : isDragCarrying(dragEvent, DRAGGED_LIST_DATA_TYPE)
            ? 'list'
            : null;
        if (carriedKind === null) return;
        dragEvent.preventDefault();
        dragEvent.dataTransfer.dropEffect = 'move';
        setDropKind(carriedKind);
      }}
      onDragLeave={(dragEvent) => {
        if (isLeavingElement(dragEvent)) setDropKind(null);
      }}
      onDrop={(dropEvent) => {
        dropEvent.preventDefault();
        setDropKind(null);
        const draggedCardId = dropEvent.dataTransfer.getData(DRAGGED_CARD_DATA_TYPE);
        if (draggedCardId !== '') {
          onDropCard(draggedCardId, boardList.id, boardList.cards.length);
          return;
        }
        const draggedListId = dropEvent.dataTransfer.getData(DRAGGED_LIST_DATA_TYPE);
        if (draggedListId !== '') onDropList(draggedListId, boardList.id);
      }}
      className={joinClassNames(
        'relative grid max-h-full w-[272px] shrink-0 snap-start grid-rows-[auto_minmax(0,1fr)_auto] gap-2 rounded-2xl bg-surface-strong/70 p-2 transition-shadow duration-150',
        dropKind === 'card' && 'ring-2 ring-primary/30',
        dropKind === 'list' && 'ring-2 ring-primary/60',
      )}
    >
      <header className="group/list-header flex items-center gap-2 py-0.5 pl-2">
        <span
          aria-hidden="true"
          title="Drag to move the list"
          draggable
          onDragStart={(dragEvent) => {
            dragEvent.dataTransfer.setData(DRAGGED_LIST_DATA_TYPE, boardList.id);
            dragEvent.dataTransfer.effectAllowed = 'move';
          }}
          className="-ml-1.5 hidden h-6 w-3.5 shrink-0 cursor-grab items-center justify-center text-muted-foreground/70 opacity-0 transition-opacity duration-150 group-focus-within/list-header:opacity-100 group-hover/list-header:opacity-100 active:cursor-grabbing sm:inline-flex"
        >
          <GripVertical className="size-3.5" />
        </span>
        <div className="grid min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[13px] font-semibold text-foreground">{boardList.name}</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {boardList.cards.length}
            </span>
          </div>
          {archiveAfter === null ? null : (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
              <Archive aria-hidden="true" className="size-3 shrink-0" />
              Archives after {archiveAfter}
            </p>
          )}
        </div>
        <IconButton
          label={`Actions for ${boardList.name}`}
          popoverTarget={listMenuId}
          className="ml-auto size-7"
        >
          <MoreHorizontal />
        </IconButton>
        <ListActionsMenu
          menuId={listMenuId}
          listName={boardList.name}
          isFirstList={isFirstList}
          isLastList={isLastList}
          renameDialogId={renameListDialogId}
          deleteDialogId={deleteListDialogId}
          onCopyForPlanning={() => onCopyListForPlanning(boardList.id)}
          onRename={() => onRenameList(boardList.id)}
          onMoveBy={(positionStep) => onMoveListBy(boardList.id, positionStep)}
          onDelete={() => onDeleteList(boardList.id)}
        />
      </header>
      {boardList.cards.length === 0 && !isComposing ? (
        <p className="grid min-h-20 place-items-center rounded-xl border border-dashed border-border-strong px-3 text-center text-xs text-muted-foreground">
          No cards. Drag one here or add one below.
        </p>
      ) : (
        <ul className="grid content-start gap-2 overflow-y-auto overscroll-contain">
          {boardList.cards.map((card, cardIndex) => (
            <li key={card.id}>
              <BoardCardTile
                card={card}
                properties={properties}
                isPending={isPendingCard(card.id)}
                now={now}
                calendarTimeZone={calendarTimeZone}
                onOpenCard={onOpenCard}
                onDropCard={(draggedCardId) => onDropCard(draggedCardId, boardList.id, cardIndex)}
              />
            </li>
          ))}
        </ul>
      )}
      {isComposing ? (
        <CardComposer
          listId={boardList.id}
          listName={boardList.name}
          onAddCard={(cardTitle) => onAddCard(boardList.id, cardTitle)}
          onCancel={onCancelComposing}
        />
      ) : (
        <button
          type="button"
          onClick={() => onStartComposing(boardList.id)}
          className="flex h-9 items-center gap-2 rounded-[10px] px-2 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-background hover:text-foreground"
        >
          <Plus className="size-4" />
          Add a card
        </button>
      )}
    </section>
  );
};

export default BoardColumn;
