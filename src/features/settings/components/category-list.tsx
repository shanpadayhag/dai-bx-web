import { Plus, Trash2 } from 'lucide-react';
import { categoryColorStyle, type Category } from '@/core/category';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import Input from '@/core/components/atoms/input';
import CategoryColorInput from '@/features/settings/components/category-color-input';

const suggestedColors = ['#8fae9a', '#a99bc9', '#d4a373', '#6f8fa6', '#b5838d', '#9a8c73'];

type CategoryListProps = {
  categories: Category[];
};

const CategoryList = ({ categories }: CategoryListProps) => (
  <div className="grid gap-4">
    <ul className="grid overflow-hidden rounded-xl border border-border">
      {categories.map((category) => (
        <li
          key={category.id}
          className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0"
        >
          <CategoryColorInput category={category} />
          <Input
            defaultValue={category.name}
            aria-label={`Rename ${category.name}`}
            className="h-9 flex-1 border-transparent bg-transparent px-2 font-medium shadow-none hover:border-border-strong"
          />
          <span className="hidden font-mono text-xs text-muted-foreground uppercase sm:inline">
            {category.color}
          </span>
          <span
            style={categoryColorStyle(category)}
            className="hidden items-center gap-1.5 md:flex"
          >
            <span className="category-solid inline-flex h-6 items-center rounded-md px-2 text-xs font-medium">
              Tracked
            </span>
            <span className="category-soft inline-flex h-6 items-center rounded-md px-2 text-xs font-medium">
              Planned
            </span>
          </span>
          <IconButton
            label={`Delete ${category.name}`}
            tone="danger"
            popoverTarget="delete-category-dialog"
          >
            <Trash2 />
          </IconButton>
        </li>
      ))}
    </ul>
    <form className="grid gap-3 rounded-xl border border-dashed border-border-strong p-3">
      <div className="flex flex-wrap items-center gap-3">
        <CategoryColorInput category={{ id: 'new', name: 'New category', color: '#8fae9a' }} />
        <Input
          placeholder="New category, like Health"
          aria-label="New category name"
          isFullWidth={false}
          className="h-9 min-w-[12rem] flex-1"
        />
        <Button type="submit" size="sm">
          <Plus />
          Add category
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Suggested</span>
        {suggestedColors.map((suggestedColor) => (
          <button
            key={suggestedColor}
            type="button"
            aria-label={`Use ${suggestedColor}`}
            style={categoryColorStyle({
              id: suggestedColor,
              name: suggestedColor,
              color: suggestedColor,
            })}
            className="category-swatch size-5 rounded-full ring-offset-2 ring-offset-background transition-shadow duration-150 hover:ring-2 hover:ring-border-strong"
          />
        ))}
      </div>
    </form>
  </div>
);

export default CategoryList;
