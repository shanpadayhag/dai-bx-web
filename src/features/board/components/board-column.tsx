import { MoreHorizontal, Plus } from 'lucide-react';
import IconButton from '@/core/components/atoms/icon-button';
import BoardCardTile from '@/features/board/components/board-card-tile';
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
  cardDetailDialogId: string;
  renameListDialogId: string;
  deleteListDialogId: string;
  now: Date;
};

const BoardColumn = ({
  boardList,
  properties,
  isFirstList,
  isLastList,
  isComposing,
  cardDetailDialogId,
  renameListDialogId,
  deleteListDialogId,
  now,
}: BoardColumnProps) => {
  const listMenuId = `list-actions-menu-${boardList.id}`;

  return (
    <section
      aria-label={boardList.name}
      className="relative grid max-h-full w-[272px] shrink-0 snap-start grid-rows-[auto_minmax(0,1fr)_auto] gap-2 rounded-2xl bg-surface-strong/70 p-2"
    >
      <header className="flex items-center gap-2 py-0.5 pl-2">
        <h2 className="truncate text-[13px] font-semibold text-foreground">{boardList.name}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{boardList.cards.length}</span>
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
        />
      </header>
      {boardList.cards.length === 0 && !isComposing ? (
        <p className="grid min-h-20 place-items-center rounded-xl border border-dashed border-border-strong px-3 text-center text-xs text-muted-foreground">
          No cards. Drag one here or add one below.
        </p>
      ) : (
        <ul className="grid content-start gap-2 overflow-y-auto overscroll-contain">
          {boardList.cards.map((card) => (
            <li key={card.id}>
              <BoardCardTile
                card={card}
                properties={properties}
                cardDetailDialogId={cardDetailDialogId}
                now={now}
              />
            </li>
          ))}
        </ul>
      )}
      {isComposing ? (
        <CardComposer listName={boardList.name} />
      ) : (
        <button
          type="button"
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
