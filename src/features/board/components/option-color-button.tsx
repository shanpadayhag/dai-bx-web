import { categoryColorStyle } from '@/core/category';

type OptionColorButtonProps = {
  colorMenuId: string;
  optionName: string;
  color: string | null;
  onOpenMenu: () => void;
};

const OptionColorButton = ({
  colorMenuId,
  optionName,
  color,
  onOpenMenu,
}: OptionColorButtonProps) => (
  <button
    type="button"
    popoverTarget={colorMenuId}
    onClick={onOpenMenu}
    aria-label={`Color for ${optionName === '' ? 'this option' : optionName}`}
    style={color === null ? undefined : categoryColorStyle({ id: color, name: optionName, color })}
    className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-border-strong bg-background shadow-soft transition-[border-color] duration-150 hover:border-primary/40"
  >
    {color === null ? (
      <span className="size-4 rounded-full border border-dashed border-muted-foreground" />
    ) : (
      <span className="category-swatch size-4 rounded-full" />
    )}
  </button>
);

export default OptionColorButton;
