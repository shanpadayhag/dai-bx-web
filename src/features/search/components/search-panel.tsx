'use client';

import { ArrowLeft, RotateCcw, Search, X } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import Kbd from '@/core/components/atoms/kbd';
import SearchResultRow from '@/features/search/components/search-result-row';
import type { SearchKind, SearchSection } from '@/features/search/entities/search-result';
import { searchWords } from '@/features/search/entities/search-words';
import useSearchEvents, {
  SEARCH_INPUT_ID,
  SEARCH_PANEL_ID,
} from '@/features/search/events/use-search-events';
import useSearchStates from '@/features/search/states/use-search-states';

const SEARCH_LISTBOX_ID = 'search-results';

const sectionTitles: Record<SearchKind, string> = {
  tasks: 'Tasks',
  groups: 'Groups',
  cards: 'Cards',
  events: 'Events',
};

const showAllLabels: Record<SearchKind, string> = {
  tasks: 'Show all tasks',
  groups: 'Show all groups',
  cards: 'Show all cards',
  events: 'Show all events',
};

const optionIdOf = (resultKey: string) => `search-option-${resultKey.replaceAll(':', '-')}`;

const KeyHint = ({ keys, label }: { keys: string[]; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="inline-flex items-center gap-0.5">
      {keys.map((keyLabel) => (
        <Kbd key={keyLabel}>{keyLabel}</Kbd>
      ))}
    </span>
    {label}
  </span>
);

const SearchPanel = () => {
  const states = useSearchStates();
  const events = useSearchEvents(states);
  const { searchQuery, searchedQuery, searchSections, expandedKind, activeResultIndex } = states;
  const { isSearching, searchError, startingResultKey } = states;
  const highlightWords = searchWords(searchedQuery);
  const shownSections: SearchSection[] = searchSections.filter(
    (searchSection) => expandedKind === null || searchSection.kind === expandedKind,
  );
  const activeResult = events.shownResults[activeResultIndex];
  const hasTypedEnough = [...searchQuery.trim()].length >= 2;
  const hasSearched = searchedQuery !== '' && searchedQuery === searchQuery.trim();
  const sectionStartIndexes = shownSections.map((_, sectionIndex) =>
    shownSections
      .slice(0, sectionIndex)
      .reduce((resultCount, earlierSection) => resultCount + earlierSection.results.length, 0),
  );

  return (
    <div
      id={SEARCH_PANEL_ID}
      popover="auto"
      role="dialog"
      aria-label="Search"
      onToggle={(toggleEvent) => events.handlePanelToggle(toggleEvent.newState)}
      className="mx-auto mt-[min(12vh,104px)] mb-auto w-[min(640px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-background p-0 text-foreground shadow-lift backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] max-sm:m-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:rounded-none max-sm:border-0"
    >
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] sm:max-h-[min(640px,calc(100dvh-8rem))]">
        <div className="relative border-b border-border">
          <div className="flex items-center gap-3 px-4 sm:px-5">
            <Search aria-hidden className="size-4.5 shrink-0 text-muted-foreground" />
            <input
              id={SEARCH_INPUT_ID}
              type="search"
              role="combobox"
              aria-label="Search tasks, groups, cards and events"
              aria-expanded={events.shownResults.length > 0}
              aria-controls={SEARCH_LISTBOX_ID}
              aria-activedescendant={
                activeResult === undefined ? undefined : optionIdOf(activeResult.key)
              }
              autoComplete="off"
              spellCheck={false}
              maxLength={200}
              placeholder="Search tasks, groups, cards, events"
              value={searchQuery}
              onChange={(changeEvent) => events.handleChangeQuery(changeEvent.target.value)}
              onKeyDown={events.handleQueryKeyDown}
              className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            />
            <span className="hidden sm:inline-flex">
              <Kbd>Esc</Kbd>
            </span>
            <IconButton
              label="Close search"
              popoverTarget={SEARCH_PANEL_ID}
              popoverTargetAction="hide"
              className="sm:hidden"
            >
              <X />
            </IconButton>
          </div>
          {isSearching && hasTypedEnough ? (
            <span
              role="progressbar"
              aria-label="Searching"
              className="absolute inset-x-0 -bottom-px h-0.5 animate-pulse bg-primary/60"
            />
          ) : null}
        </div>
        <div className="overflow-y-auto overscroll-contain p-2">
          {expandedKind === null ? null : (
            <div className="flex items-center gap-2 px-1 pt-1 pb-2">
              <Button variant="ghost" size="sm" onClick={events.handleShowEveryKind}>
                <ArrowLeft />
                All results
              </Button>
              <span className="text-[13px] font-medium text-foreground">
                {sectionTitles[expandedKind]}
              </span>
            </div>
          )}
          {searchError !== null ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-danger-soft px-4 py-3 text-[13px] text-danger"
            >
              <span>Search didn’t load: {searchError.description}</span>
              <Button variant="secondary" size="sm" onClick={events.handleRetrySearch}>
                <RotateCcw />
                Try again
              </Button>
            </div>
          ) : !hasTypedEnough ? (
            <div className="grid gap-1 px-3 py-8 text-center">
              <p className="text-sm font-medium text-foreground">
                Find a task, group, card or event
              </p>
              <p className="text-[13px] text-muted-foreground">
                Type the start of any word. Words can come in any order.
              </p>
            </div>
          ) : hasSearched && shownSections.length === 0 ? (
            <div role="status" className="grid gap-1 px-3 py-8 text-center">
              <p className="text-sm font-medium text-foreground">
                Nothing matches “{searchedQuery}”
              </p>
              <p className="text-[13px] text-muted-foreground">
                Try fewer words, or just the start of one.
              </p>
            </div>
          ) : (
            <ul
              id={SEARCH_LISTBOX_ID}
              role="listbox"
              aria-label="Search results"
              className="grid gap-3"
            >
              {shownSections.map((searchSection, sectionIndex) => (
                <li key={searchSection.kind} role="presentation" className="grid gap-0.5">
                  <ul
                    role="group"
                    aria-label={sectionTitles[searchSection.kind]}
                    className="grid gap-0.5"
                  >
                    <li
                      role="presentation"
                      className="px-3 pt-1 pb-1 text-xs font-medium text-muted-foreground"
                    >
                      {sectionTitles[searchSection.kind]}
                    </li>
                    {searchSection.results.map((searchResult, resultIndex) => {
                      const shownIndex = (sectionStartIndexes[sectionIndex] ?? 0) + resultIndex;
                      return (
                        <SearchResultRow
                          key={searchResult.key}
                          optionId={optionIdOf(searchResult.key)}
                          searchResult={searchResult}
                          words={highlightWords}
                          isActive={shownIndex === activeResultIndex}
                          isStarting={startingResultKey === searchResult.key}
                          runningSourceIds={events.runningSourceIds}
                          calendarTimeZone={events.calendarTimeZone}
                          onHover={() => events.handleHoverResult(shownIndex)}
                          onOpen={() => events.handleOpenResult(searchResult)}
                          onStart={() => void events.handleStartResult(searchResult)}
                        />
                      );
                    })}
                  </ul>
                  {expandedKind === null && searchSection.hasMore ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mx-1 justify-self-start"
                      onClick={() => events.handleShowAll(searchSection.kind)}
                    >
                      {showAllLabels[searchSection.kind]}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="hidden flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-surface px-5 py-2.5 text-xs text-muted-foreground sm:flex">
          <KeyHint keys={['↑', '↓']} label="Move" />
          <KeyHint keys={['↵']} label="Open" />
          <KeyHint keys={['⌘', '↵']} label="Start" />
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;
