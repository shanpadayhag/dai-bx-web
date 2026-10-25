import { Check } from 'lucide-react';
import type { AccentColor } from '@/core/appearance';
import joinClassNames from '@/core/class-names';

const accentOptions: readonly {
  accentColor: AccentColor;
  name: string;
  swatchClassName: string;
}[] = [
  { accentColor: 'blue', name: 'Blue', swatchClassName: 'bg-[#2456f0]' },
  { accentColor: 'indigo', name: 'Indigo', swatchClassName: 'bg-[#4f46e5]' },
  { accentColor: 'teal', name: 'Teal', swatchClassName: 'bg-[#0d7f77]' },
  { accentColor: 'violet', name: 'Violet', swatchClassName: 'bg-[#7c3aed]' },
  { accentColor: 'graphite', name: 'Graphite', swatchClassName: 'bg-[#3b4256]' },
];

type AccentPickerProps = {
  selectedAccentColor: AccentColor;
  onSelectAccentColor: (accentColor: AccentColor) => void;
};

const AccentPicker = ({ selectedAccentColor, onSelectAccentColor }: AccentPickerProps) => (
  <div role="radiogroup" aria-label="Accent color" className="flex flex-wrap gap-3">
    {accentOptions.map((accentOption) => {
      const isSelected = accentOption.accentColor === selectedAccentColor;
      return (
        <button
          key={accentOption.accentColor}
          type="button"
          role="radio"
          aria-checked={isSelected}
          className="grid justify-items-center gap-1.5"
          onClick={() => onSelectAccentColor(accentOption.accentColor)}
        >
          <span
            className={joinClassNames(
              'inline-flex size-9 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-background transition-shadow duration-150',
              accentOption.swatchClassName,
              isSelected ? 'ring-2 ring-foreground' : 'hover:ring-2 hover:ring-border-strong',
            )}
          >
            {isSelected ? <Check className="size-4" strokeWidth={3} /> : null}
          </span>
          <span className="text-xs text-muted-foreground">
            {accentOption.name}
            {accentOption.accentColor === 'blue' ? ' · default' : ''}
          </span>
        </button>
      );
    })}
  </div>
);

export default AccentPicker;
