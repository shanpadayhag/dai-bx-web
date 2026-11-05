import { describe, expect, test } from 'vitest';
import {
  draftTimes,
  movedTimes,
  resizedEnd,
  snapMinute,
} from '@/features/calendar/entities/calendar-drag';

const dayStart = new Date(2026, 10, 5);
const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute);

describe('snapMinute', () => {
  test('snaps to the nearest quarter hour inside the day', () => {
    expect(snapMinute(67)).toBe(60);
    expect(snapMinute(68)).toBe(75);
    expect(snapMinute(-20)).toBe(0);
    expect(snapMinute(24 * 60 + 40)).toBe(24 * 60);
  });
});

describe('draftTimes', () => {
  test('a drag down covers the snapped quarter hours it crossed', () => {
    expect(draftTimes(dayStart, 9 * 60 + 2, 10 * 60 + 29)).toEqual({
      startsAt: at(5, 9),
      endsAt: at(5, 10, 30),
    });
  });

  test('a drag up works the same way', () => {
    expect(draftTimes(dayStart, 11 * 60, 9 * 60 + 50)).toEqual({
      startsAt: at(5, 9, 45),
      endsAt: at(5, 11),
    });
  });

  test('a click without a drag drafts an hour', () => {
    expect(draftTimes(dayStart, 14 * 60 + 5, 14 * 60 + 6)).toEqual({
      startsAt: at(5, 14),
      endsAt: at(5, 15),
    });
  });

  test('a click late at night still drafts an hour, ending the next day', () => {
    expect(draftTimes(dayStart, 23 * 60 + 40, 23 * 60 + 40)).toEqual({
      startsAt: at(5, 23, 45),
      endsAt: at(6, 0, 45),
    });
  });
});

describe('movedTimes', () => {
  const plannedTimes = { startsAt: at(5, 9), endsAt: at(5, 10, 30) };

  test('moves by snapped minutes and keeps the length', () => {
    expect(movedTimes(plannedTimes, 52, 0)).toEqual({
      startsAt: at(5, 9, 45),
      endsAt: at(5, 11, 15),
    });
  });

  test('moves to another day at the same clock time', () => {
    expect(movedTimes(plannedTimes, 0, -2)).toEqual({
      startsAt: at(3, 9),
      endsAt: at(3, 10, 30),
    });
  });

  test('a move across the night the clocks go back keeps the clock time', () => {
    expect(
      movedTimes({ startsAt: new Date(2026, 9, 31, 9), endsAt: new Date(2026, 9, 31, 10) }, 0, 1),
    ).toEqual({ startsAt: new Date(2026, 10, 1, 9), endsAt: new Date(2026, 10, 1, 10) });
  });
});

describe('resizedEnd', () => {
  test('the end follows the pointer to the quarter hour', () => {
    expect(resizedEnd(at(5, 9), dayStart, 11 * 60 + 8)).toEqual(at(5, 11, 15));
  });

  test('never ends less than 15 minutes after the start', () => {
    expect(resizedEnd(at(5, 9), dayStart, 8 * 60)).toEqual(at(5, 9, 15));
  });
});
