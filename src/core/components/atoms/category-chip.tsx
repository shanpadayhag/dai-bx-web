import { categoryColorStyle, type Category } from '@/core/category';
import joinClassNames from '@/core/class-names';

type CategoryChipProps = {
  category: Category;
  className?: string;
};

const CategoryChip = ({ category, className }: CategoryChipProps) => (
  <span
    style={categoryColorStyle(category)}
    className={joinClassNames(
      'inline-flex h-5.5 items-center gap-1.5 rounded-md bg-surface-strong px-1.5 text-xs font-medium whitespace-nowrap text-foreground',
      className,
    )}
  >
    <span className="category-swatch size-2 rounded-full" />
    {category.name}
  </span>
);

export default CategoryChip;
