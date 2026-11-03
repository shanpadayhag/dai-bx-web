import { Ban } from 'lucide-react';
import { categoryColorStyle } from '@/core/category';
import PopoverMenu from '@/core/components/molecules/popover-menu';
import hidePopover from '@/core/popover';
import { optionColors } from '@/features/board/enums/option-color';

type OptionColorMenuProps = {
  menuId: string;
  chosenColor: string | null;
  onChooseColor: (color: string | null) => void;
};

const swatchClassName =
  'inline-flex size-8 items-center justify-center rounded-lg transition-[box-shadow] duration-150 hover:ring-2 hover:ring-border-strong focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:outline-none aria-checked:ring-2 aria-checked:ring-foreground';

const OptionColorMenu = ({ menuId, chosenColor, onChooseColor }: OptionColorMenuProps) => {
  const chooseColor = (color: string | null) => {
    hidePopover(menuId);
    if (color !== chosenColor) onChooseColor(color);
  };

  return (
    <PopoverMenu id={menuId} label="Option color" placement="start" className="w-auto">
      <div className="grid grid-cols-5 gap-1">
        <button
          type="button"
          role="menuitemradio"
          aria-checked={chosenColor === null}
          aria-label="No color"
          title="No color"
          onClick={() => chooseColor(null)}
          className={`${swatchClassName} bg-surface-strong text-muted-foreground [&_svg]:size-3.5`}
        >
          <Ban />
        </button>
        {optionColors.map((optionColor) => (
          <button
            key={optionColor}
            type="button"
            role="menuitemradio"
            aria-checked={chosenColor === optionColor}
            aria-label={`Color ${optionColor}`}
            title={optionColor}
            onClick={() => chooseColor(optionColor)}
            style={categoryColorStyle({ id: optionColor, name: optionColor, color: optionColor })}
            className={swatchClassName}
          >
            <span className="category-swatch size-5 rounded-md" />
          </button>
        ))}
      </div>
    </PopoverMenu>
  );
};

export default OptionColorMenu;
