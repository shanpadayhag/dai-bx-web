'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import joinClassNames from '@/core/class-names';

type AppNavLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
  count?: number;
};

const AppNavLink = ({ href, icon, label, count }: AppNavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={joinClassNames(
        'group flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-sm transition-colors duration-150 [&_svg]:size-[17px]',
        isActive
          ? 'bg-background font-medium text-foreground shadow-soft'
          : 'text-muted-foreground hover:bg-surface-strong hover:text-foreground',
      )}
    >
      <span
        className={isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {count === undefined ? null : (
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
      )}
    </Link>
  );
};

export default AppNavLink;
