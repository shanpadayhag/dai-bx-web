import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import IconButton from '@/core/components/atoms/icon-button';
import AppSidebar from '@/core/components/organisms/app-sidebar';

type AppShellProps = {
  sidebarAccount?: ReactNode;
  topbarSearch?: ReactNode;
  topbarEnd?: ReactNode;
  overlays?: ReactNode;
  children: ReactNode;
};

const AppShell = ({
  sidebarAccount,
  topbarSearch,
  topbarEnd,
  overlays,
  children,
}: AppShellProps) => (
  <div className="flex min-h-dvh bg-surface">
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 border-r border-border lg:block">
      <AppSidebar account={sidebarAccount} />
    </aside>
    <div
      id="app-menu"
      popover="auto"
      className="m-0 h-dvh w-[280px] border-r border-border bg-surface p-0 shadow-lift backdrop:bg-ink/40"
    >
      <AppSidebar account={sidebarAccount} />
    </div>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-xl sm:px-6">
        <IconButton label="Open navigation" popoverTarget="app-menu" className="lg:hidden">
          <Menu />
        </IconButton>
        {topbarSearch}
        <div className="ml-auto flex items-center gap-2">{topbarEnd}</div>
      </header>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
    {overlays}
  </div>
);

export default AppShell;
