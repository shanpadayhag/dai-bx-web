import type { ReactNode } from 'react';
import joinClassNames from '@/core/class-names';

type AuthIconTone = 'primary' | 'success' | 'warning';

const toneClassNames: Record<AuthIconTone, string> = {
  primary: 'bg-primary-soft text-primary-soft-foreground',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
};

type AuthIconProps = {
  tone?: AuthIconTone;
  children: ReactNode;
};

const AuthIcon = ({ tone = 'primary', children }: AuthIconProps) => (
  <span
    className={joinClassNames(
      'inline-flex size-11 items-center justify-center rounded-xl [&_svg]:size-5',
      toneClassNames[tone],
    )}
  >
    {children}
  </span>
);

export default AuthIcon;
