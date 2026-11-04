import { categoryColorStyle, type Category } from '@/core/category';

type CategoryPickerProps = {
  name: string;
  legend: string;
  categories: readonly Category[];
  selectedCategoryId: string | null;
};

const optionClassName =
  'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground has-checked:border-primary/50 has-checked:bg-primary-soft has-checked:text-primary-soft-foreground has-focus-visible:ring-4 has-focus-visible:ring-primary/20';

const CategoryPicker = ({ name, legend, categories, selectedCategoryId }: CategoryPickerProps) => (
  <fieldset className="grid gap-1.5">
    <legend className="mb-1.5 text-[13px] font-medium text-foreground">{legend}</legend>
    <div className="flex flex-wrap gap-1.5">
      {categories.map((category) => (
        <label key={category.id} style={categoryColorStyle(category)} className={optionClassName}>
          <input
            type="radio"
            name={name}
            value={category.id}
            defaultChecked={category.id === selectedCategoryId}
            className="sr-only"
          />
          <span className="category-swatch size-2 rounded-full" />
          {category.name}
        </label>
      ))}
      <label className={optionClassName}>
        <input
          type="radio"
          name={name}
          value=""
          defaultChecked={selectedCategoryId === null}
          className="sr-only"
        />
        <span className="size-2 rounded-full border-[1.5px] border-dashed border-muted-foreground" />
        None
      </label>
    </div>
  </fieldset>
);

export default CategoryPicker;
