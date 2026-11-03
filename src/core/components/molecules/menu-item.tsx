import type { ReactNode } from 'react';
import joinClassNames from '@/core/class-names';

type MenuItemProps = {
  icon: ReactNode;
  label: string;
  tone?: 'default' | 'danger';
  isPhoneOnly?: boolean;
  isDisabled?: boolean;
  isCurrent?: boolean;
  popoverTarget?: string;
  onChoose?: () => void;
};

const MenuItem = ({
  icon,
  label,
  tone = 'default',
  isPhoneOnly = false,
  isDisabled = false,
  isCurrent = false,
  popoverTarget,
  onChoose,
}: MenuItemProps) => (
  <button
    type="button"
    role="menuitem"
    disabled={isDisabled}
    aria-current={isCurrent ? 'true' : undefined}
    popoverTarget={popoverTarget}
    onClick={onChoose}
    className={joinClassNames(
      'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
      tone === 'danger'
        ? 'text-danger hover:bg-danger-soft focus-visible:bg-danger-soft'
        : 'text-foreground hover:bg-surface-strong focus-visible:bg-surface-strong [&_svg]:text-muted-foreground',
      isCurrent && 'font-medium [&_svg]:text-primary',
      isPhoneOnly && 'sm:hidden',
    )}
  >
    {icon}
    <span className="min-w-0 flex-1 truncate">{label}</span>
  </button>
);

export default MenuItem;
