import { categoryColorStyle, type Category } from '@/core/category';

type CategoryColorInputProps = {
  category: Category;
};

const CategoryColorInput = ({ category }: CategoryColorInputProps) => (
  <label
    style={categoryColorStyle(category)}
    className="category-swatch relative inline-flex size-7 shrink-0 cursor-pointer rounded-full ring-1 ring-border-strong ring-offset-2 ring-offset-background transition-shadow duration-150 focus-within:ring-2 focus-within:ring-primary hover:ring-2 hover:ring-border-strong"
  >
    <input
      type="color"
      defaultValue={category.color}
      aria-label={`${category.name} color`}
      className="absolute inset-0 size-full cursor-pointer opacity-0"
    />
  </label>
);

export default CategoryColorInput;
