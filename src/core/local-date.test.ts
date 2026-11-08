import { describe, expect, test } from 'vitest';
import localCalendarDate from '@/core/local-date';

describe('localCalendarDate', () => {
  test('writes the local date with padded month and day', () => {
    expect(localCalendarDate(new Date(2026, 2, 7, 23, 30))).toBe('2026-03-07');
    expect(localCalendarDate(new Date(2026, 10, 19, 0, 0))).toBe('2026-11-19');
  });
});
