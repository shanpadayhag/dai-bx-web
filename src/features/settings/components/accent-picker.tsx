import { Check } from 'lucide-react';
import joinClassNames from '@/core/class-names';

const accentOptions = [
  { name: 'Blue', swatchClassName: 'bg-[#2456f0]', isSelected: true },
  { name: 'Indigo', swatchClassName: 'bg-[#4f46e5]', isSelected: false },
  { name: 'Teal', swatchClassName: 'bg-[#0f8f86]', isSelected: false },
  { name: 'Violet', swatchClassName: 'bg-[#7c3aed]', isSelected: false },
  { name: 'Graphite', swatchClassName: 'bg-[#3b4256]', isSelected: false },
] as const;

const AccentPicker = () => (
  <div role="radiogroup" aria-label="Accent color" className="flex flex-wrap gap-3">
    {accentOptions.map((accentOption) => (
      <button
        key={accentOption.name}
        type="button"
        role="radio"
        aria-checked={accentOption.isSelected}
        className="grid justify-items-center gap-1.5"
      >
        <span
          className={joinClassNames(
            'inline-flex size-9 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-background transition-shadow duration-150',
            accentOption.swatchClassName,
            accentOption.isSelected
              ? 'ring-2 ring-foreground'
              : 'hover:ring-2 hover:ring-border-strong',
          )}
        >
          {accentOption.isSelected ? <Check className="size-4" strokeWidth={3} /> : null}
        </span>
        <span className="text-xs text-muted-foreground">
          {accentOption.name}
          {accentOption.isSelected ? ' · default' : ''}
        </span>
      </button>
    ))}
  </div>
);

export default AccentPicker;
