import { describe, expect, test } from 'vitest';
import type RunningItem from '@/features/tracking/entities/running-item';
import { checkInSinceMoment, formatElapsed } from '@/features/tracking/entities/running-item';

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
