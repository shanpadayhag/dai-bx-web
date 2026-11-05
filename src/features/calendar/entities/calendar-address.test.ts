import { describe, expect, test } from 'vitest';
import {
  calendarPath,
  readCalendarAddress,
  shiftAnchorDay,
} from '@/features/calendar/entities/calendar-address';

const today = new Date(2026, 10, 5, 18, 2);

describe('readCalendarAddress', () => {
  test('reads the view and the day from the address', () => {
    expect(readCalendarAddress('?view=day&date=2026-11-03', null, today)).toEqual({
      view: 'day',
      anchorDay: new Date(2026, 10, 3),
    });
  });

  test('without a view in the address the remembered one is used, then week', () => {
    expect(readCalendarAddress('?date=2026-11-03', 'day', today).view).toBe('day');
    expect(readCalendarAddress('', null, today).view).toBe('week');
  });

  test('a missing or broken day falls back to today', () => {
    for (const brokenSearch of ['', '?date=yesterday', '?date=2026-02-30', '?date=2026-13-01']) {
      expect(readCalendarAddress(brokenSearch, null, today).anchorDay).toEqual(
        new Date(2026, 10, 5),
      );
    }
  });

  test('an unknown view falls back to the remembered one', () => {
    expect(readCalendarAddress('?view=month', 'day', today).view).toBe('day');
  });
});

describe('calendarPath', () => {
  test('writes the view and the local day', () => {
    expect(calendarPath('week', new Date(2026, 0, 7, 23, 30))).toBe(
      '/calendar?view=week&date=2026-01-07',
    );
  });
});

describe('shiftAnchorDay', () => {
  test('a week view steps a week and a day view steps a day', () => {
    expect(shiftAnchorDay('week', new Date(2026, 10, 5), 1)).toEqual(new Date(2026, 10, 12));
    expect(shiftAnchorDay('day', new Date(2026, 10, 1), -1)).toEqual(new Date(2026, 9, 31));
  });
});
