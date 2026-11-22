import { CalendarDays, FolderOpen, ListChecks, Play, Repeat, SquareKanban } from 'lucide-react';
import Badge from '@/core/components/atoms/badge';
import joinClassNames from '@/core/class-names';
import { formatClockInZone } from '@/core/time-zone';
import { formatInZone } from '@/core/zoned-time';
import HighlightedText from '@/features/search/components/highlighted-text';
import {
  isResultRunning,
  searchResultStartTarget,
  shownParentPath,
  type SearchResult,
} from '@/features/search/entities/search-result';

type SearchResultRowProps = {
  optionId: string;
  searchResult: SearchResult;
  words: readonly string[];
  isActive: boolean;
  isStarting: boolean;
  runningSourceIds: ReadonlySet<string>;
  calendarTimeZone: string;
  onHover: () => void;
  onOpen: () => void;
  onStart: () => void;
};

const resultIcons = {
  tasks: ListChecks,
  groups: FolderOpen,
  cards: SquareKanban,
  events: CalendarDays,
} as const;

const describeEventTime = (startsAt: Date, endsAt: Date, timeZone: string): string => {
  const dayText = formatInZone(startsAt, timeZone, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(startsAt.getFullYear() === new Date().getFullYear() ? {} : { year: 'numeric' }),
  });
  return `${dayText} · ${formatClockInZone(startsAt, timeZone)}–${formatClockInZone(endsAt, timeZone)}`;
};

const resultContext = (searchResult: SearchResult, calendarTimeZone: string): string => {
  switch (searchResult.kind) {
    case 'tasks': {
      const parentPath = shownParentPath(searchResult);
      return parentPath === ''
        ? searchResult.groupName
        : `${searchResult.groupName} · ${parentPath}`;
    }
    case 'groups':
      return searchResult.openTaskCount === 1
        ? '1 open task'
        : `${searchResult.openTaskCount} open tasks`;
    case 'cards':
      return `${searchResult.boardName} · ${searchResult.listName}`;
    case 'events':
      return describeEventTime(searchResult.startsAt, searchResult.endsAt, calendarTimeZone);
  }
};

const SearchResultRow = ({
  optionId,
  searchResult,
  words,
  isActive,
  isStarting,
  runningSourceIds,
  calendarTimeZone,
  onHover,
  onOpen,
  onStart,
}: SearchResultRowProps) => {
  const ResultIcon = resultIcons[searchResult.kind];
  const isRunning = isResultRunning(searchResult, runningSourceIds);
  const startTarget = searchResultStartTarget(searchResult, runningSourceIds);
  const cardSnippet = searchResult.kind === 'cards' ? searchResult.snippet : null;

  return (
    <li
      id={optionId}
      role="option"
      aria-selected={isActive}
      onMouseMove={onHover}
      onClick={onOpen}
      className={joinClassNames(
        'group/result flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-100',
        isActive ? 'bg-surface-strong' : 'hover:bg-surface',
      )}
    >
      <span
        className={joinClassNames(
          'relative inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground [&_svg]:size-4',
          isActive && 'border-border-strong text-foreground',
        )}
      >
        <ResultIcon aria-hidden />
        {searchResult.kind === 'events' && searchResult.categoryColor !== null ? (
          <span
            aria-hidden
            className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background"
            style={{ backgroundColor: searchResult.categoryColor }}
          />
        ) : null}
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p
          className={joinClassNames(
            'truncate text-sm font-medium text-foreground',
            searchResult.kind === 'tasks' &&
              searchResult.isDone &&
              'text-muted-foreground line-through decoration-border-strong',
          )}
        >
          <HighlightedText text={searchResult.title} words={words} />
        </p>
        <p className="truncate text-xs text-muted-foreground tabular-nums">
          {resultContext(searchResult, calendarTimeZone)}
        </p>
        {cardSnippet === null ? null : (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            <HighlightedText text={cardSnippet} words={words} />
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {searchResult.kind === 'tasks' && searchResult.isDone ? <Badge>Done</Badge> : null}
        {searchResult.kind === 'cards' && searchResult.isArchived ? <Badge>Archived</Badge> : null}
        {searchResult.kind === 'events' && searchResult.repeats ? (
          <Badge>
            <Repeat aria-hidden />
            Repeats
          </Badge>
        ) : null}
        {isRunning ? <Badge tone="success">Running</Badge> : null}
        {startTarget === null ? null : (
          <button
            type="button"
            disabled={isStarting}
            aria-label={`Start ${searchResult.kind === 'events' ? 'the task for ' : ''}${searchResult.title}`}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onStart();
            }}
            className={joinClassNames(
              'inline-flex h-7 items-center gap-1 rounded-lg border border-border-strong bg-background px-2 text-xs font-medium text-foreground shadow-soft transition-[opacity,background-color] duration-150 hover:bg-surface disabled:opacity-60 [&_svg]:size-3.5',
              isActive || isStarting
                ? 'opacity-100'
                : 'opacity-0 group-hover/result:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
            )}
          >
            <Play aria-hidden />
            {isStarting ? 'Starting…' : 'Start'}
          </button>
        )}
      </div>
    </li>
  );
};

export default SearchResultRow;
