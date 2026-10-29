import { Check } from 'lucide-react';
import joinClassNames from '@/core/class-names';

type CompletionCircleProps = {
  isDone: boolean;
  label: string;
  size?: 'sm' | 'md';
  onToggle?: () => void;
};

const CompletionCircle = ({ isDone, label, size = 'md', onToggle }: CompletionCircleProps) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={isDone}
    aria-label={label}
    onClick={onToggle}
    className={joinClassNames(
      'group/circle inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors duration-150',
      size === 'md' ? 'size-[18px]' : 'size-4',
      isDone
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border-strong text-transparent hover:border-primary hover:text-primary/60',
    )}
  >
    <Check className="size-3" strokeWidth={3} />
  </button>
);

export default CompletionCircle;
