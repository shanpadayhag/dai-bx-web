import { Bell, Menu, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import IconButton from '@/core/components/atoms/icon-button';
import Kbd from '@/core/components/atoms/kbd';
import AppSidebar from '@/core/components/organisms/app-sidebar';

type AppShellProps = {
  topbarEnd?: ReactNode;
  overlays?: ReactNode;
  children: ReactNode;
};

const AppShell = ({ topbarEnd, overlays, children }: AppShellProps) => (
  <div className="flex min-h-dvh bg-surface">
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 border-r border-border lg:block">
      <AppSidebar />
    </aside>
    <div
      id="app-menu"
      popover="auto"
      className="m-0 h-dvh w-[280px] border-r border-border bg-surface p-0 shadow-lift backdrop:bg-ink/40"
    >
      <AppSidebar />
    </div>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-xl sm:px-6">
        <IconButton label="Open navigation" popoverTarget="app-menu" className="lg:hidden">
          <Menu />
        </IconButton>
        <button
          type="button"
          className="hidden h-9 w-full max-w-[340px] items-center gap-2 rounded-[10px] border border-border bg-background px-3 text-sm text-muted-foreground transition-colors duration-150 hover:border-border-strong sm:flex"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search tasks, cards, events</span>
          <span className="hidden items-center gap-0.5 sm:inline-flex">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        <IconButton label="Search" className="sm:hidden">
          <Search />
        </IconButton>
        <div className="ml-auto flex items-center gap-2">
          {topbarEnd}
          <IconButton label="Notifications">
            <Bell />
          </IconButton>
        </div>
      </header>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
    {overlays}
  </div>
);

export default AppShell;
