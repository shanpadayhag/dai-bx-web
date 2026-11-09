import { describe, expect, test } from 'vitest';
import type RunningItem from '@/features/tracking/entities/running-item';
import {
  checkInSinceMoment,
  formatElapsed,
  runningItemFromRecord,
} from '@/features/tracking/entities/running-item';
import type RunningItemRecord from '@/features/tracking/entities/running-item-record';

const startedAt = new Date(2026, 10, 5, 16, 20, 0);

describe('formatElapsed', () => {
  test('shows hours, minutes and seconds', () => {
    expect(formatElapsed(startedAt, new Date(2026, 10, 5, 18, 2, 8))).toBe('1:42:08');
  });

  test('never shows a negative time when the clock is behind the start', () => {
    expect(formatElapsed(startedAt, new Date(2026, 10, 5, 16, 19))).toBe('0:00:00');
  });
});

describe('checkInSinceMoment', () => {
  const runningItem: RunningItem = {
    id: 'event',
    title: 'Write the v3 changelog',
    sourceKind: 'task',
    sourceId: 'task-1',
    sourceName: 'DaiBX',
    startedAt,
    lastAnsweredAt: null,
    estimateMinutes: 45,
  };

  test('asks since the start when nothing was answered yet', () => {
    expect(checkInSinceMoment(runningItem)).toBe(startedAt);
  });

  test('asks since the last answer once one exists', () => {
    const lastAnsweredAt = new Date(2026, 10, 5, 17, 20);
    expect(checkInSinceMoment({ ...runningItem, lastAnsweredAt })).toBe(lastAnsweredAt);
  });
});

describe('runningItemFromRecord', () => {
  const runningItemRecord: RunningItemRecord = {
    id: 'event-1',
    kind: 'tracked',
    title: 'Plan the release',
    categoryId: null,
    startsAt: '2026-11-06T00:20:00.000Z',
    endsAt: null,
    finishedAt: null,
    lastAnsweredAt: '2026-11-06T01:20:00.000Z',
    timeZone: null,
    series: null,
    source: { kind: 'card', id: 'card-1', boardId: 'board-1' },
    estimateMinutes: null,
    sourceName: 'Projects',
  };

  test('reads where it came from and its times', () => {
    expect(runningItemFromRecord(runningItemRecord)).toEqual({
      id: 'event-1',
      title: 'Plan the release',
      sourceKind: 'card',
      sourceId: 'card-1',
      sourceName: 'Projects',
      startedAt: new Date('2026-11-06T00:20:00.000Z'),
      lastAnsweredAt: new Date('2026-11-06T01:20:00.000Z'),
      estimateMinutes: null,
    });
  });

  test('a task keeps its estimate and a missing answer stays empty', () => {
    const taskItem = runningItemFromRecord({
      ...runningItemRecord,
      source: { kind: 'task', id: 'task-1', groupId: 'group-1' },
      sourceName: 'DaiBX',
      estimateMinutes: 45,
      lastAnsweredAt: null,
    });

    expect(taskItem).toMatchObject({
      sourceKind: 'task',
      sourceId: 'task-1',
      estimateMinutes: 45,
      lastAnsweredAt: null,
    });
  });
});
