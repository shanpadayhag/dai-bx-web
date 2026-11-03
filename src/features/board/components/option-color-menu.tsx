import { Ban } from 'lucide-react';
import { categoryColorStyle } from '@/core/category';
import PopoverMenu from '@/core/components/molecules/popover-menu';
import { optionColors } from '@/features/board/enums/option-color';

type OptionColorMenuProps = {
  menuId: string;
};

const swatchClassName =
  'inline-flex size-8 items-center justify-center rounded-lg transition-[box-shadow] duration-150 hover:ring-2 hover:ring-border-strong focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:outline-none';

const OptionColorMenu = ({ menuId }: OptionColorMenuProps) => (
  <PopoverMenu id={menuId} label="Option color" placement="start" className="w-auto">
    <div className="grid grid-cols-5 gap-1">
      <button
        type="button"
        role="menuitemradio"
        aria-checked="false"
        aria-label="No color"
        title="No color"
        className={`${swatchClassName} bg-surface-strong text-muted-foreground [&_svg]:size-3.5`}
      >
        <Ban />
      </button>
      {optionColors.map((optionColor) => (
        <button
          key={optionColor}
          type="button"
          role="menuitemradio"
          aria-checked="false"
          aria-label={`Color ${optionColor}`}
          title={optionColor}
          style={categoryColorStyle({ id: optionColor, name: optionColor, color: optionColor })}
          className={swatchClassName}
        >
          <span className="category-swatch size-5 rounded-md" />
        </button>
      ))}
    </div>
  </PopoverMenu>
);

export default OptionColorMenu;
