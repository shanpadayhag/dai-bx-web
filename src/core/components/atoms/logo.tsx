import Link from 'next/link';
import joinClassNames from '@/core/class-names';

type LogoProps = {
  href?: string;
  className?: string;
  tone?: 'default' | 'inverse';
};

const LogoMark = () => (
  <svg viewBox="0 0 28 28" aria-hidden="true" className="size-7 shrink-0">
    <rect width="28" height="28" rx="8" className="fill-primary" />
    <rect x="7" y="7.5" width="9" height="3" rx="1.5" fill="white" />
    <rect x="11" y="12.5" width="10" height="3" rx="1.5" fill="white" fillOpacity="0.75" />
    <rect x="11" y="17.5" width="6" height="3" rx="1.5" fill="white" fillOpacity="0.5" />
  </svg>
);

const Logo = ({ href = '/', className, tone = 'default' }: LogoProps) => (
  <Link
    href={href}
    className={joinClassNames(
      'inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]',
      tone === 'inverse' ? 'text-ink-foreground' : 'text-foreground',
      className,
    )}
  >
    <LogoMark />
    DaiBX
  </Link>
);

export default Logo;
