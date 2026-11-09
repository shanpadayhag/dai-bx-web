import { describe, expect, test } from 'vitest';
import {
  calendarPath,
  readCalendarAddress,
  shiftAnchorDate,
} from '@/features/calendar/entities/calendar-address';

const todayDate = '2026-11-05';

describe('readCalendarAddress', () => {
  test('reads the view and the date from the address', () => {
    expect(readCalendarAddress('?view=day&date=2026-11-03', null, todayDate)).toEqual({
      view: 'day',
      anchorDate: '2026-11-03',
    });
  });

  test('without a view in the address the remembered one is used, then week', () => {
    expect(readCalendarAddress('?date=2026-11-03', 'day', todayDate).view).toBe('day');
    expect(readCalendarAddress('', null, todayDate).view).toBe('week');
  });

  test('a missing or broken date falls back to today', () => {
    for (const brokenSearch of ['', '?date=yesterday', '?date=2026-02-30', '?date=2026-13-01']) {
      expect(readCalendarAddress(brokenSearch, null, todayDate).anchorDate).toBe(todayDate);
    }
  });

  test('an unknown view falls back to the remembered one', () => {
    expect(readCalendarAddress('?view=month', 'day', todayDate).view).toBe('day');
  });
});

describe('calendarPath', () => {
  test('writes the view and the date', () => {
    expect(calendarPath('week', '2026-01-07')).toBe('/calendar?view=week&date=2026-01-07');
  });
});

describe('shiftAnchorDate', () => {
  test('a week view steps a week and a day view steps a day', () => {
    expect(shiftAnchorDate('week', '2026-11-05', 1)).toBe('2026-11-12');
    expect(shiftAnchorDate('day', '2026-11-01', -1)).toBe('2026-10-31');
  });
});
