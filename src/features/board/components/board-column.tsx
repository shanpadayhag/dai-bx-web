import { MoreHorizontal, Plus } from 'lucide-react';
import IconButton from '@/core/components/atoms/icon-button';
import BoardList from '@/features/board/entities/board-list';
import BoardCardTile from '@/features/board/components/board-card-tile';

type BoardColumnProps = {
  boardList: BoardList;
};

const BoardColumn = ({ boardList }: BoardColumnProps) => (
  <section
    aria-label={boardList.name}
    className="grid w-[264px] shrink-0 content-start gap-2 rounded-2xl bg-surface-strong/70 p-2"
  >
    <header className="flex items-center gap-2 px-1.5 pt-1">
      <h2 className="text-[13px] font-semibold text-foreground">{boardList.name}</h2>
      <span className="text-xs text-muted-foreground tabular-nums">{boardList.cards.length}</span>
      <IconButton label={`Actions for ${boardList.name}`} className="ml-auto size-7">
        <MoreHorizontal />
      </IconButton>
    </header>
    <ul className="grid gap-2">
      {boardList.cards.map((card) => (
        <li key={card.id}>
          <BoardCardTile card={card} />
        </li>
      ))}
    </ul>
    <button
      type="button"
      className="flex h-9 items-center gap-2 rounded-[10px] px-2 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-background hover:text-foreground"
    >
      <Plus className="size-4" />
      Add a card
    </button>
  </section>
);

export default BoardColumn;
