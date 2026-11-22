import { partsInZone } from '@/core/zoned-time';
import type {
  CardMatchRecord,
  EventMatchRecord,
  GroupMatchRecord,
  SearchResultsRecord,
  SearchSectionRecord,
  TaskMatchRecord,
} from '@/features/search/entities/search-result-record';

const SEARCH_KINDS = ['tasks', 'groups', 'cards', 'events'] as const;

type SearchKind = (typeof SEARCH_KINDS)[number];

type TaskResult = {
  kind: 'tasks';
  key: string;
  id: string;
  title: string;
  groupId: string;
  groupName: string;
  parentNames: string[];
  isDone: boolean;
  isRunning: boolean;
};

type GroupResult = {
  kind: 'groups';
  key: string;
  id: string;
  title: string;
  openTaskCount: number;
};

type CardResult = {
  kind: 'cards';
  key: string;
  id: string;
  title: string;
  boardId: string;
  boardName: string;
  listName: string;
  isArchived: boolean;
  isRunning: boolean;
  snippet: string | null;
};

type EventResult = {
  kind: 'events';
  key: string;
  calendarEventId: string;
  title: string;
  categoryColor: string | null;
  startsAt: Date;
  endsAt: Date;
  repeats: boolean;
  linkedTaskId: string | null;
};

type SearchResult = TaskResult | GroupResult | CardResult | EventResult;

type SearchSection = {
  kind: SearchKind;
  results: SearchResult[];
  hasMore: boolean;
};

type StartTarget = {
  sourceKind: 'task' | 'card';
  sourceId: string;
};

const PARENT_NAMES_SHOWN = 3;

const taskResultFromRecord = (taskRecord: TaskMatchRecord): TaskResult => ({
  kind: 'tasks',
  key: `task:${taskRecord.id}`,
  id: taskRecord.id,
  title: taskRecord.name,
  groupId: taskRecord.groupId,
  groupName: taskRecord.groupName,
  parentNames: taskRecord.parentNames,
  isDone: taskRecord.done,
  isRunning: taskRecord.running,
});

const groupResultFromRecord = (groupRecord: GroupMatchRecord): GroupResult => ({
  kind: 'groups',
  key: `group:${groupRecord.id}`,
  id: groupRecord.id,
  title: groupRecord.name,
  openTaskCount: groupRecord.openTaskCount,
});

const cardResultFromRecord = (cardRecord: CardMatchRecord): CardResult => ({
  kind: 'cards',
  key: `card:${cardRecord.id}`,
  id: cardRecord.id,
  title: cardRecord.title,
  boardId: cardRecord.boardId,
  boardName: cardRecord.boardName,
  listName: cardRecord.listName,
  isArchived: cardRecord.archived,
  isRunning: cardRecord.running,
  snippet: cardRecord.snippet,
});

const eventResultFromRecord = (eventRecord: EventMatchRecord): EventResult => {
  const calendarEventId =
    eventRecord.seriesId === null
      ? eventRecord.id
      : `${eventRecord.seriesId}:${eventRecord.startsAt}`;
  return {
    kind: 'events',
    key: `event:${calendarEventId}`,
    calendarEventId,
    title: eventRecord.title,
    categoryColor: eventRecord.categoryColor,
    startsAt: new Date(eventRecord.startsAt),
    endsAt: new Date(eventRecord.endsAt),
    repeats: eventRecord.repeats,
    linkedTaskId: eventRecord.taskId,
  };
};

const sectionFromRecord = <MatchRecord>(
  kind: SearchKind,
  sectionRecord: SearchSectionRecord<MatchRecord> | undefined,
  resultFromRecord: (matchRecord: MatchRecord) => SearchResult,
): SearchSection[] =>
  sectionRecord === undefined || sectionRecord.items.length === 0
    ? []
    : [
        {
          kind,
          results: sectionRecord.items.map(resultFromRecord),
          hasMore: sectionRecord.hasMore,
        },
      ];

const searchSectionsFromRecord = (resultsRecord: SearchResultsRecord): SearchSection[] => [
  ...sectionFromRecord('tasks', resultsRecord.tasks, taskResultFromRecord),
  ...sectionFromRecord('groups', resultsRecord.groups, groupResultFromRecord),
  ...sectionFromRecord('cards', resultsRecord.cards, cardResultFromRecord),
  ...sectionFromRecord('events', resultsRecord.events, eventResultFromRecord),
];

const shownParentPath = (taskResult: TaskResult): string => {
  const shownParentNames = taskResult.parentNames.slice(-PARENT_NAMES_SHOWN);
  const hiddenParentPrefix = taskResult.parentNames.length > PARENT_NAMES_SHOWN ? ['…'] : [];
  return [...hiddenParentPrefix, ...shownParentNames].join(' › ');
};

const searchResultPath = (searchResult: SearchResult, calendarTimeZone: string): string => {
  switch (searchResult.kind) {
    case 'tasks':
      return `/tasks?group=${searchResult.groupId}&task=${searchResult.id}`;
    case 'groups':
      return `/tasks?group=${searchResult.id}`;
    case 'cards':
      return searchResult.isArchived
        ? `/board?board=${searchResult.boardId}&archived-card=${searchResult.id}`
        : `/board?board=${searchResult.boardId}&card=${searchResult.id}`;
    case 'events': {
      const eventDate = partsInZone(searchResult.startsAt, calendarTimeZone).calendarDate;
      return `/calendar?view=day&date=${eventDate}&event=${encodeURIComponent(searchResult.calendarEventId)}`;
    }
  }
};

const isResultRunning = (
  searchResult: SearchResult,
  runningSourceIds: ReadonlySet<string>,
): boolean => {
  switch (searchResult.kind) {
    case 'tasks':
    case 'cards':
      return searchResult.isRunning || runningSourceIds.has(searchResult.id);
    case 'events':
      return searchResult.linkedTaskId !== null && runningSourceIds.has(searchResult.linkedTaskId);
    case 'groups':
      return false;
  }
};

const searchResultStartTarget = (
  searchResult: SearchResult,
  runningSourceIds: ReadonlySet<string>,
): StartTarget | null => {
  if (isResultRunning(searchResult, runningSourceIds)) return null;
  switch (searchResult.kind) {
    case 'tasks':
      return searchResult.isDone ? null : { sourceKind: 'task', sourceId: searchResult.id };
    case 'cards':
      return searchResult.isArchived ? null : { sourceKind: 'card', sourceId: searchResult.id };
    case 'events':
      return searchResult.linkedTaskId === null
        ? null
        : { sourceKind: 'task', sourceId: searchResult.linkedTaskId };
    case 'groups':
      return null;
  }
};

export type {
  CardResult,
  EventResult,
  GroupResult,
  SearchKind,
  SearchResult,
  SearchSection,
  StartTarget,
  TaskResult,
};
export {
  isResultRunning,
  SEARCH_KINDS,
  searchResultPath,
  searchResultStartTarget,
  searchSectionsFromRecord,
  shownParentPath,
};
