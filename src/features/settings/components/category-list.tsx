import { Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { categoryColorStyle, type Category } from '@/core/category';
import joinClassNames from '@/core/class-names';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import Input from '@/core/components/atoms/input';
import CategoryColorInput from '@/features/settings/components/category-color-input';
import { DELETE_CATEGORY_DIALOG_ID } from '@/features/settings/components/delete-category-dialog';

export const SUGGESTED_CATEGORY_COLORS = [
  '#8fae9a',
  '#a99bc9',
  '#d4a373',
  '#6f8fa6',
  '#b5838d',
  '#9a8c73',
] as const;
export const NEW_CATEGORY_ERROR_KEY = 'new-category';

type CategoryListProps = {
  categories: readonly Category[];
  categoryNameErrors: Readonly<Record<string, string>>;
  newCategoryColor: string;
  isAddingCategory: boolean;
  onRenameCategory: (categoryId: Category['id'], enteredName: string) => void;
  onRecolorCategory: (categoryId: Category['id'], chosenColor: string) => void;
  onRequestDeleteCategory: (categoryId: Category['id']) => void;
  onChooseNewCategoryColor: (chosenColor: string) => void;
  onAddCategory: (submitEvent: FormEvent<HTMLFormElement>) => void;
};

const FieldErrorText = ({ id, message }: { id: string; message: string | undefined }) =>
  message === undefined ? null : (
    <p id={id} className="text-xs text-danger">
      {message}
    </p>
  );

const CategoryList = ({
  categories,
  categoryNameErrors,
  newCategoryColor,
  isAddingCategory,
  onRenameCategory,
  onRecolorCategory,
  onRequestDeleteCategory,
  onChooseNewCategoryColor,
  onAddCategory,
}: CategoryListProps) => {
  const newCategoryError = categoryNameErrors[NEW_CATEGORY_ERROR_KEY];
  const newCategoryErrorId = 'new-category-error';

  return (
    <div className="grid gap-4">
      {categories.length > 0 ? (
        <ul className="grid overflow-hidden rounded-xl border border-border">
          {categories.map((category) => {
            const categoryNameError = categoryNameErrors[category.id];
            const categoryErrorId = `category-error-${category.id}`;
            return (
              <li
                key={category.id}
                className="grid gap-1 border-b border-border px-3 py-2 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <CategoryColorInput
                    key={category.color}
                    category={category}
                    label={`${category.name} color`}
                    onColorCommit={(committedColor) =>
                      onRecolorCategory(category.id, committedColor)
                    }
                  />
                  <Input
                    key={category.name}
                    defaultValue={category.name}
                    maxLength={50}
                    aria-label={`Rename ${category.name}`}
                    aria-invalid={categoryNameError === undefined ? undefined : true}
                    aria-describedby={categoryNameError === undefined ? undefined : categoryErrorId}
                    onBlur={(blurEvent) =>
                      onRenameCategory(category.id, blurEvent.currentTarget.value)
                    }
                    onKeyDown={(keyEvent) => {
                      if (keyEvent.key === 'Enter') keyEvent.currentTarget.blur();
                      if (keyEvent.key === 'Escape') {
                        keyEvent.currentTarget.value = category.name;
                        keyEvent.currentTarget.blur();
                      }
                    }}
                    className={joinClassNames(
                      'h-9 min-w-32 flex-1 border-transparent bg-transparent px-2 font-medium shadow-none hover:border-border-strong',
                      categoryNameError !== undefined && 'border-danger hover:border-danger',
                    )}
                  />
                  <span className="hidden font-mono text-xs text-muted-foreground uppercase lg:inline">
                    {category.color}
                  </span>
                  <span
                    style={categoryColorStyle(category)}
                    className="hidden items-center gap-1.5 xl:flex"
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
                    popoverTarget={DELETE_CATEGORY_DIALOG_ID}
                    onClick={() => onRequestDeleteCategory(category.id)}
                  >
                    <Trash2 />
                  </IconButton>
                </div>
                <div className="pl-10">
                  <FieldErrorText id={categoryErrorId} message={categoryNameError} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-border px-3 py-4 text-sm text-muted-foreground">
          No categories yet. Groups without one show a hollow dot.
        </p>
      )}
      <form
        onSubmit={onAddCategory}
        className="grid gap-3 rounded-xl border border-dashed border-border-strong p-3"
      >
        <div className="flex flex-wrap items-center gap-3">
          <CategoryColorInput
            key={newCategoryColor}
            category={{ id: 'new-category', name: 'New category', color: newCategoryColor }}
            label="New category color"
            onColorCommit={onChooseNewCategoryColor}
          />
          <Input
            name="categoryName"
            placeholder="New category, like Health"
            aria-label="New category name"
            maxLength={50}
            aria-invalid={newCategoryError === undefined ? undefined : true}
            aria-describedby={newCategoryError === undefined ? undefined : newCategoryErrorId}
            isFullWidth={false}
            className={joinClassNames(
              'h-9 min-w-[12rem] flex-1',
              newCategoryError !== undefined && 'border-danger',
            )}
          />
          <Button type="submit" size="sm" disabled={isAddingCategory}>
            <Plus />
            Add category
          </Button>
        </div>
        <FieldErrorText id={newCategoryErrorId} message={newCategoryError} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Suggested</span>
          {SUGGESTED_CATEGORY_COLORS.map((suggestedColor) => (
            <button
              key={suggestedColor}
              type="button"
              aria-label={`Use ${suggestedColor}`}
              aria-pressed={suggestedColor === newCategoryColor}
              onClick={() => onChooseNewCategoryColor(suggestedColor)}
              style={categoryColorStyle({
                id: suggestedColor,
                name: suggestedColor,
                color: suggestedColor,
              })}
              className="category-swatch size-5 rounded-full ring-offset-2 ring-offset-background transition-shadow duration-150 hover:ring-2 hover:ring-border-strong aria-pressed:ring-2 aria-pressed:ring-primary"
            />
          ))}
        </div>
      </form>
    </div>
  );
};

export default CategoryList;
