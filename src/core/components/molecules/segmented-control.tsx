import joinClassNames from '@/core/class-names';

type SegmentedControlProps = {
  label: string;
  options: readonly string[];
  selectedOption: string;
  onSelectOption?: (option: string) => void;
  className?: string;
};

const SegmentedControl = ({
  label,
  options,
  selectedOption,
  onSelectOption,
  className,
}: SegmentedControlProps) => (
  <div
    role="radiogroup"
    aria-label={label}
    className={joinClassNames(
      'inline-flex h-9 items-center gap-0.5 rounded-[10px] bg-surface-strong p-0.5',
      className,
    )}
  >
    {options.map((option) => {
      const isSelected = option === selectedOption;
      return (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={isSelected}
          onClick={onSelectOption === undefined ? undefined : () => onSelectOption(option)}
          className={joinClassNames(
            'h-8 rounded-lg px-3 text-[13px] font-medium transition-colors duration-150',
            isSelected
              ? 'bg-background text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option}
        </button>
      );
    })}
  </div>
);

export default SegmentedControl;
