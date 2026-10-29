import { ArrowDown, ArrowUp, MoveRight, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import joinClassNames from '@/core/class-names';

type MenuItemProps = {
  icon: ReactNode;
  label: string;
  tone?: 'default' | 'danger';
  isPhoneOnly?: boolean;
  isDisabled?: boolean;
  onChoose: () => void;
};

const MenuItem = ({
  icon,
  label,
  tone = 'default',
  isPhoneOnly = false,
  isDisabled = false,
  onChoose,
}: MenuItemProps) => (
  <button
    type="button"
    role="menuitem"
    disabled={isDisabled}
    onClick={onChoose}
    className={joinClassNames(
      'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
      tone === 'danger'
        ? 'text-danger hover:bg-danger-soft focus-visible:bg-danger-soft'
        : 'text-foreground hover:bg-surface-strong focus-visible:bg-surface-strong [&_svg]:text-muted-foreground',
      isPhoneOnly && 'sm:hidden',
    )}
  >
    {icon}
    {label}
  </button>
);

type TaskActionsMenuProps = {
  menuId: string;
  isFirstInList: boolean;
  isLastInList: boolean;
  onAddSubtask: () => void;
  onRename: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveTo: () => void;
  onDelete: () => void;
};

const TaskActionsMenu = ({
  menuId,
  isFirstInList,
  isLastInList,
  onAddSubtask,
  onRename,
  onMoveUp,
  onMoveDown,
  onMoveTo,
  onDelete,
}: TaskActionsMenuProps) => (
  <div
    id={menuId}
    popover="auto"
    role="menu"
    aria-label="Task actions"
    className="m-auto w-56 rounded-xl border border-border bg-background p-1.5 text-foreground shadow-lift backdrop:bg-transparent supports-[position-area:bottom]:m-0 supports-[position-area:bottom]:mt-1 supports-[position-area:bottom]:[position-area:bottom_span-left] supports-[position-area:bottom]:[position-try-fallbacks:flip-block]"
  >
    <MenuItem icon={<Plus />} label="Add a subtask" isPhoneOnly onChoose={onAddSubtask} />
    <MenuItem icon={<Pencil />} label="Rename" isPhoneOnly onChoose={onRename} />
    <MenuItem icon={<ArrowUp />} label="Move up" isDisabled={isFirstInList} onChoose={onMoveUp} />
    <MenuItem
      icon={<ArrowDown />}
      label="Move down"
      isDisabled={isLastInList}
      onChoose={onMoveDown}
    />
    <MenuItem icon={<MoveRight />} label="Move to…" onChoose={onMoveTo} />
    <div role="separator" className="mx-1 my-1 h-px bg-border" />
    <MenuItem icon={<Trash2 />} label="Delete" tone="danger" onChoose={onDelete} />
  </div>
);

export default TaskActionsMenu;
