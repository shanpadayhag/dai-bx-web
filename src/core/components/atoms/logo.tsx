import Link from 'next/link';
import {
  MARK_BAR_COLOR,
  MARK_BAR_CORNER_RADIUS,
  MARK_BAR_HEIGHT,
  MARK_TILE_CORNER_RADIUS,
  MARK_VIEWBOX_SIZE,
  markBars,
} from '@/core/brand/mark';
import joinClassNames from '@/core/class-names';

type LogoProps = {
  href?: string;
  className?: string;
  tone?: 'default' | 'inverse';
};

const LogoMark = () => (
  <svg
    viewBox={`0 0 ${MARK_VIEWBOX_SIZE} ${MARK_VIEWBOX_SIZE}`}
    aria-hidden="true"
    className="size-7 shrink-0"
  >
    <rect
      width={MARK_VIEWBOX_SIZE}
      height={MARK_VIEWBOX_SIZE}
      rx={MARK_TILE_CORNER_RADIUS}
      className="fill-primary"
    />
    {markBars.map((markBar) => (
      <rect
        key={markBar.y}
        x={markBar.x}
        y={markBar.y}
        width={markBar.width}
        height={MARK_BAR_HEIGHT}
        rx={MARK_BAR_CORNER_RADIUS}
        fill={MARK_BAR_COLOR}
        fillOpacity={markBar.opacity}
      />
    ))}
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
