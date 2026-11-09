import { describe, expect, test } from 'vitest';
import type RunningItem from '@/features/tracking/entities/running-item';
import { checkInDueAt, isCheckInDue } from '@/features/tracking/entities/check-in';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';

const startedAt = new Date(2026, 10, 5, 16, 0);

const runningItem: RunningItem = {
  id: 'event-1',
  title: 'Write the changelog',
  sourceKind: 'task',
  sourceId: 'task-1',
  sourceName: 'DaiBX',
  startedAt,
  lastAnsweredAt: null,
  estimateMinutes: 45,
};

const timeTrackingSettings: TimeTrackingSettings = {
  checkInsEnabled: true,
  checkInIntervalMinutes: 30,
  firstCheckInMinutes: 20,
  workingHoursStart: '16:00',
  workingHoursEnd: '02:00',
  trackedCategoryId: null,
  calendarTimeZone: null,
};

describe('checkInDueAt', () => {
  test('the first check-in comes when the estimate runs out', () => {
    expect(checkInDueAt(runningItem, timeTrackingSettings)).toEqual(new Date(2026, 10, 5, 16, 45));
  });

  test('without an estimate the first check-in comes after the first check-in setting', () => {
    expect(checkInDueAt({ ...runningItem, estimateMinutes: null }, timeTrackingSettings)).toEqual(
      new Date(2026, 10, 5, 16, 20),
    );
  });

  test('after a Yes the next one comes one interval after that answer', () => {
    expect(
      checkInDueAt(
        { ...runningItem, lastAnsweredAt: new Date(2026, 10, 5, 16, 50) },
        timeTrackingSettings,
      ),
    ).toEqual(new Date(2026, 10, 5, 17, 20));
  });

  test('nothing is due while check-ins are off', () => {
    expect(
      checkInDueAt(runningItem, { ...timeTrackingSettings, checkInsEnabled: false }),
    ).toBeNull();
  });
});

describe('isCheckInDue', () => {
  test('is not due a minute before its time and is due at it', () => {
    expect(isCheckInDue(runningItem, timeTrackingSettings, new Date(2026, 10, 5, 16, 44))).toBe(
      false,
    );
    expect(isCheckInDue(runningItem, timeTrackingSettings, new Date(2026, 10, 5, 16, 45))).toBe(
      true,
    );
  });

  test('a tab closed for hours finds the check-in overdue as soon as it opens again', () => {
    expect(isCheckInDue(runningItem, timeTrackingSettings, new Date(2026, 10, 5, 21, 10))).toBe(
      true,
    );
  });

  test('is never due while check-ins are off', () => {
    expect(
      isCheckInDue(
        runningItem,
        { ...timeTrackingSettings, checkInsEnabled: false },
        new Date(2026, 10, 6),
      ),
    ).toBe(false);
  });
});
