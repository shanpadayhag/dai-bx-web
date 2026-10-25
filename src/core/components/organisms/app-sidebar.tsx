import { CalendarDays, KanbanSquare, ListTree, Plus, Repeat2, Settings, Sun } from 'lucide-react';
import Kbd from '@/core/components/atoms/kbd';
import Logo from '@/core/components/atoms/logo';
import type { ReactNode } from 'react';
import AppNavLink from '@/core/components/molecules/app-nav-link';

const primaryLinks = [
  { href: '/today', label: 'Today', icon: <Sun />, count: 6 },
  { href: '/tasks', label: 'Tasks', icon: <ListTree />, count: 24 },
  { href: '/board', label: 'Board', icon: <KanbanSquare /> },
  { href: '/calendar', label: 'Calendar', icon: <CalendarDays /> },
  { href: '/workflows', label: 'Workflows', icon: <Repeat2 />, count: 4 },
];

type AppSidebarProps = {
  account?: ReactNode;
};

const AppSidebar = ({ account }: AppSidebarProps) => (
  <div className="flex h-full flex-col gap-6 p-3">
    <div className="flex items-center justify-between px-1.5 pt-1.5">
      <Logo href="/today" />
    </div>
    <button
      type="button"
      className="flex h-9 items-center gap-2 rounded-[10px] border border-border-strong bg-background px-2.5 text-sm text-muted-foreground shadow-soft transition-colors duration-150 hover:border-primary/40 hover:text-foreground"
    >
      <Plus className="size-4 text-primary" />
      <span className="flex-1 text-left">New task</span>
      <Kbd>N</Kbd>
    </button>
    <nav aria-label="Workspace" className="grid gap-0.5">
      {primaryLinks.map((primaryLink) => (
        <AppNavLink key={primaryLink.href} {...primaryLink} />
      ))}
    </nav>
    <div className="mt-auto grid gap-0.5">
      <AppNavLink href="/settings" label="Settings" icon={<Settings />} />
      {account}
    </div>
  </div>
);

export default AppSidebar;
