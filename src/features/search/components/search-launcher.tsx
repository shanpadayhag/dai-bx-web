'use client';

import { Search } from 'lucide-react';
import IconButton from '@/core/components/atoms/icon-button';
import Kbd from '@/core/components/atoms/kbd';
import SearchPanel from '@/features/search/components/search-panel';
import { SEARCH_PANEL_ID } from '@/features/search/events/use-search-events';

const SearchLauncher = () => (
  <>
    <button
      type="button"
      popoverTarget={SEARCH_PANEL_ID}
      className="hidden h-9 w-full max-w-[340px] items-center gap-2 rounded-[10px] border border-border bg-background px-3 text-sm text-muted-foreground transition-colors duration-150 hover:border-border-strong sm:flex"
    >
      <Search className="size-4" />
      <span className="flex-1 text-left">Search tasks, cards, events</span>
      <span className="hidden items-center gap-0.5 sm:inline-flex">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
    <IconButton label="Search" popoverTarget={SEARCH_PANEL_ID} className="sm:hidden">
      <Search />
    </IconButton>
    <SearchPanel />
  </>
);

export default SearchLauncher;
