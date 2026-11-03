import { ArrowLeft, ArrowRight, ClipboardCopy, Pencil, Trash2 } from 'lucide-react';
import MenuItem from '@/core/components/molecules/menu-item';
import PopoverMenu, { MenuSeparator } from '@/core/components/molecules/popover-menu';

type ListActionsMenuProps = {
  menuId: string;
  listName: string;
  isFirstList: boolean;
  isLastList: boolean;
  renameDialogId: string;
  deleteDialogId: string;
};

const ListActionsMenu = ({
  menuId,
  listName,
  isFirstList,
  isLastList,
  renameDialogId,
  deleteDialogId,
}: ListActionsMenuProps) => (
  <PopoverMenu id={menuId} label={`Actions for ${listName}`}>
    <MenuItem icon={<ClipboardCopy />} label="Copy for planning" />
    <MenuSeparator />
    <MenuItem icon={<Pencil />} label="Rename" popoverTarget={renameDialogId} />
    <MenuItem icon={<ArrowLeft />} label="Move left" isDisabled={isFirstList} />
    <MenuItem icon={<ArrowRight />} label="Move right" isDisabled={isLastList} />
    <MenuSeparator />
    <MenuItem icon={<Trash2 />} label="Delete list" tone="danger" popoverTarget={deleteDialogId} />
  </PopoverMenu>
);

export default ListActionsMenu;
