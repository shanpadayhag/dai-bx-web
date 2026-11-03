import { ArrowDown, ArrowUp, MoveRight, Pencil, Plus, Trash2 } from 'lucide-react';
import MenuItem from '@/core/components/molecules/menu-item';
import PopoverMenu, { MenuSeparator } from '@/core/components/molecules/popover-menu';

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
  <PopoverMenu id={menuId} label="Task actions">
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
    <MenuSeparator />
    <MenuItem icon={<Trash2 />} label="Delete" tone="danger" onChoose={onDelete} />
  </PopoverMenu>
);

export default TaskActionsMenu;
