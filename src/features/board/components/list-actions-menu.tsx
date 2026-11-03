import { ArrowLeft, ArrowRight, ClipboardCopy, Pencil, Trash2 } from 'lucide-react';
import MenuItem from '@/core/components/molecules/menu-item';
import PopoverMenu, { MenuSeparator } from '@/core/components/molecules/popover-menu';
import hidePopover from '@/core/popover';

type ListActionsMenuProps = {
  menuId: string;
  listName: string;
  isFirstList: boolean;
  isLastList: boolean;
  renameDialogId: string;
  deleteDialogId: string;
  onCopyForPlanning: () => void;
  onRename: () => void;
  onMoveBy: (positionStep: number) => void;
  onDelete: () => void;
};

const ListActionsMenu = ({
  menuId,
  listName,
  isFirstList,
  isLastList,
  renameDialogId,
  deleteDialogId,
  onCopyForPlanning,
  onRename,
  onMoveBy,
  onDelete,
}: ListActionsMenuProps) => {
  const closeThen = (chooseAction: () => void) => () => {
    hidePopover(menuId);
    chooseAction();
  };

  return (
    <PopoverMenu id={menuId} label={`Actions for ${listName}`}>
      <MenuItem
        icon={<ClipboardCopy />}
        label="Copy for planning"
        onChoose={closeThen(onCopyForPlanning)}
      />
      <MenuSeparator />
      <MenuItem
        icon={<Pencil />}
        label="Rename"
        popoverTarget={renameDialogId}
        onChoose={closeThen(onRename)}
      />
      <MenuItem
        icon={<ArrowLeft />}
        label="Move left"
        isDisabled={isFirstList}
        onChoose={closeThen(() => onMoveBy(-1))}
      />
      <MenuItem
        icon={<ArrowRight />}
        label="Move right"
        isDisabled={isLastList}
        onChoose={closeThen(() => onMoveBy(1))}
      />
      <MenuSeparator />
      <MenuItem
        icon={<Trash2 />}
        label="Delete list"
        tone="danger"
        popoverTarget={deleteDialogId}
        onChoose={closeThen(onDelete)}
      />
    </PopoverMenu>
  );
};

export default ListActionsMenu;
