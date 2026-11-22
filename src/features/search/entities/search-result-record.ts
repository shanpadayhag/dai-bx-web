type SearchSectionRecord<MatchRecord> = {
  items: MatchRecord[];
  hasMore: boolean;
};

type TaskMatchRecord = {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  parentNames: string[];
  done: boolean;
  running: boolean;
};

type GroupMatchRecord = {
  id: string;
  name: string;
  openTaskCount: number;
};

type CardMatchRecord = {
  id: string;
  title: string;
  boardId: string;
  boardName: string;
  listName: string;
  archived: boolean;
  running: boolean;
  snippet: string | null;
};

type EventMatchRecord = {
  id: string;
  seriesId: string | null;
  title: string;
  categoryColor: string | null;
  startsAt: string;
  endsAt: string;
  timeZone: string | null;
  repeats: boolean;
  taskId: string | null;
};

type SearchResultsRecord = {
  tasks?: SearchSectionRecord<TaskMatchRecord>;
  groups?: SearchSectionRecord<GroupMatchRecord>;
  cards?: SearchSectionRecord<CardMatchRecord>;
  events?: SearchSectionRecord<EventMatchRecord>;
};

export type {
  CardMatchRecord,
  EventMatchRecord,
  GroupMatchRecord,
  SearchResultsRecord,
  SearchSectionRecord,
  TaskMatchRecord,
};
