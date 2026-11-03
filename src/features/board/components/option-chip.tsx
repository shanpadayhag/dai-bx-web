import { categoryColorStyle } from '@/core/category';
import joinClassNames from '@/core/class-names';
import type PropertyOption from '@/features/board/entities/property-option';

type OptionChipProps = {
  propertyName: string;
  option: PropertyOption;
  className?: string;
};

const OptionChip = ({ propertyName, option, className }: OptionChipProps) => (
  <span
    title={`${propertyName}: ${option.name}`}
    style={
      option.color === null ? undefined : categoryColorStyle({ ...option, color: option.color })
    }
    className={joinClassNames(
      'inline-flex h-5.5 max-w-full items-center gap-1.5 rounded-md bg-surface-strong px-1.5 text-xs font-medium whitespace-nowrap text-foreground',
      className,
    )}
  >
    {option.color === null ? null : (
      <span className="category-swatch size-2 shrink-0 rounded-full" />
    )}
    <span className="sr-only">{propertyName}: </span>
    <span className="truncate">{option.name}</span>
  </span>
);

export default OptionChip;
