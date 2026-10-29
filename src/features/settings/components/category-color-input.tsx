import { useEffect, useRef, useState } from 'react';
import { categoryColorStyle, type Category } from '@/core/category';

type CategoryColorInputProps = {
  category: Category;
  label: string;
  onColorCommit: (committedColor: string) => void;
};

const CategoryColorInput = ({ category, label, onColorCommit }: CategoryColorInputProps) => {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [previewColor, setPreviewColor] = useState(category.color);
  const latestOnColorCommit = useRef(onColorCommit);

  useEffect(() => {
    latestOnColorCommit.current = onColorCommit;
  }, [onColorCommit]);

  useEffect(() => {
    const colorInput = colorInputRef.current;
    if (colorInput === null) return;
    const handleNativeChange = () => latestOnColorCommit.current(colorInput.value);
    colorInput.addEventListener('change', handleNativeChange);
    return () => colorInput.removeEventListener('change', handleNativeChange);
  }, []);

  return (
    <label
      style={categoryColorStyle({ ...category, color: previewColor })}
      className="category-swatch relative inline-flex size-7 shrink-0 cursor-pointer rounded-full ring-1 ring-border-strong ring-offset-2 ring-offset-background transition-shadow duration-150 focus-within:ring-2 focus-within:ring-primary hover:ring-2 hover:ring-border-strong"
    >
      <input
        ref={colorInputRef}
        type="color"
        value={previewColor}
        onInput={(inputEvent) => setPreviewColor(inputEvent.currentTarget.value)}
        onChange={(changeEvent) => setPreviewColor(changeEvent.currentTarget.value)}
        aria-label={label}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
    </label>
  );
};

export default CategoryColorInput;
