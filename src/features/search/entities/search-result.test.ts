import { describe, expect, test } from 'vitest';
import {
  searchResultPath,
  searchResultStartTarget,
  searchSectionsFromRecord,
  shownParentPath,
  type SearchResult,
  type TaskResult,
} from '@/features/search/entities/search-result';

const taskResult = (taskChanges: Partial<TaskResult> = {}): TaskResult => ({
  kind: 'tasks',
  key: 'task:task-1',
  id: 'task-1',
  title: 'Fruit',
  groupId: 'group-1',
  groupName: 'Weekly',
  parentNames: [],
  isDone: false,
  isRunning: false,
  ...taskChanges,
});

const sections = searchSectionsFromRecord({
  tasks: {
    items: [
      {
        id: 'task-1',
        name: 'Fruit',
        groupId: 'group-1',
        groupName: 'Weekly',
        parentNames: ['Groceries'],
        done: false,
        running: false,
      },
    ],
    hasMore: true,
  },
  groups: { items: [], hasMore: false },
  cards: {
    items: [
      {
        id: 'card-1',
        title: 'Chinese HSK 3',
        boardId: 'board-1',
        boardName: 'Personal',
        listName: 'To do',
        archived: true,
        running: false,
        snippet: null,
      },
    ],
    hasMore: false,
  },
  events: {
    items: [
      {
        id: 'series-1',
        seriesId: 'series-1',
        title: 'Gym',
        categoryColor: '#3b82f6',
        startsAt: '2026-11-23T16:30:00.000Z',
        endsAt: '2026-11-23T17:30:00.000Z',
        timeZone: 'Asia/Manila',
        repeats: true,
        taskId: null,
      },
    ],
    hasMore: false,
  },
});

const resultOfKind = (kind: SearchResult['kind']): SearchResult => {
  const foundResult = sections.find((section) => section.kind === kind)?.results[0];
  if (foundResult === undefined) throw new Error(`no ${kind} result`);
  return foundResult;
};

describe('searchSectionsFromRecord', () => {
  test('keeps the section order and drops empty sections', () => {
    expect(sections.map((section) => section.kind)).toEqual(['tasks', 'cards', 'events']);
    expect(sections[0]?.hasMore).toBe(true);
  });
});

describe('searchResultPath', () => {
  test('opens a task in its group and a group on its own', () => {
    expect(searchResultPath(resultOfKind('tasks'), 'UTC')).toBe('/tasks?group=group-1&task=task-1');
    expect(
      searchResultPath(
        { kind: 'groups', key: 'group:group-1', id: 'group-1', title: 'Weekly', openTaskCount: 2 },
        'UTC',
      ),
    ).toBe('/tasks?group=group-1');
  });

  test('opens an archived card in the archive', () => {
    expect(searchResultPath(resultOfKind('cards'), 'UTC')).toBe(
      '/board?board=board-1&archived-card=card-1',
    );
  });

  test('opens a repeating event on its day in the calendar zone with its occurrence id', () => {
    expect(searchResultPath(resultOfKind('events'), 'Asia/Manila')).toBe(
      `/calendar?view=day&date=2026-11-24&event=${encodeURIComponent('series-1:2026-11-23T16:30:00.000Z')}`,
    );
    expect(searchResultPath(resultOfKind('events'), 'UTC')).toContain('date=2026-11-23');
  });
});

describe('searchResultStartTarget', () => {
  test('starts an open task that is not running', () => {
    expect(searchResultStartTarget(taskResult(), new Set())).toEqual({
      sourceKind: 'task',
      sourceId: 'task-1',
    });
  });

  test('offers no start for a done, running or already tracked task', () => {
    expect(searchResultStartTarget(taskResult({ isDone: true }), new Set())).toBeNull();
    expect(searchResultStartTarget(taskResult({ isRunning: true }), new Set())).toBeNull();
    expect(searchResultStartTarget(taskResult(), new Set(['task-1']))).toBeNull();
  });

  test('offers no start for an archived card or an event without a task', () => {
    expect(searchResultStartTarget(resultOfKind('cards'), new Set())).toBeNull();
    expect(searchResultStartTarget(resultOfKind('events'), new Set())).toBeNull();
  });
});

describe('shownParentPath', () => {
  test('shows at most the three nearest parents', () => {
    expect(shownParentPath(taskResult({ parentNames: ['Groceries'] }))).toBe('Groceries');
    expect(shownParentPath(taskResult({ parentNames: ['A', 'B', 'C', 'D'] }))).toBe(
      '… › B › C › D',
    );
  });
});
