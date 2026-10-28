import { ArrowDown, ArrowUp, MoveRight, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import joinClassNames from '@/core/class-names';

type MenuItemProps = {
  icon: ReactNode;
  label: string;
  tone?: 'default' | 'danger';
  isPhoneOnly?: boolean;
  popoverTarget?: string;
};

const MenuItem = ({
  icon,
  label,
  tone = 'default',
  isPhoneOnly = false,
  popoverTarget,
}: MenuItemProps) => (
  <button
    type="button"
    role="menuitem"
    popoverTarget={popoverTarget}
    className={joinClassNames(
      'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors duration-150 focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0',
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

const TaskActionsMenu = () => (
  <div
    id="task-actions-menu"
    popover="auto"
    role="menu"
    aria-label="Task actions"
    className="m-auto w-56 rounded-xl border border-border bg-background p-1.5 text-foreground shadow-lift backdrop:bg-transparent supports-[position-area:bottom]:m-0 supports-[position-area:bottom]:mt-1 supports-[position-area:bottom]:[position-area:bottom_span-left] supports-[position-area:bottom]:[position-try-fallbacks:flip-block]"
  >
    <MenuItem icon={<Plus />} label="Add a subtask" isPhoneOnly />
    <MenuItem icon={<Pencil />} label="Rename" isPhoneOnly />
    <MenuItem icon={<ArrowUp />} label="Move up" />
    <MenuItem icon={<ArrowDown />} label="Move down" />
    <MenuItem icon={<MoveRight />} label="Move to…" popoverTarget="move-task-dialog" />
    <div role="separator" className="mx-1 my-1 h-px bg-border" />
    <MenuItem icon={<Trash2 />} label="Delete" tone="danger" popoverTarget="delete-task-dialog" />
  </div>
);

export default TaskActionsMenu;
