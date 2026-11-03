import { describe, expect, test } from 'vitest';
import { formatCardDue, isCardDueOverdue } from '@/features/board/entities/card-due';

const localMoment = (month: number, day: number, hour = 0, minute = 0) =>
  new Date(2026, month - 1, day, hour, minute);

describe('isCardDueOverdue', () => {
  test('a date-only card is not overdue at any time on its due day', () => {
    const cardDue = { dueDate: '2026-11-05', dueTime: null };
    expect(isCardDueOverdue(cardDue, localMoment(11, 5, 0, 0))).toBe(false);
    expect(isCardDueOverdue(cardDue, localMoment(11, 5, 23, 59))).toBe(false);
  });

  test('a date-only card becomes overdue when the next day starts', () => {
    expect(isCardDueOverdue({ dueDate: '2026-11-05', dueTime: null }, localMoment(11, 6))).toBe(
      true,
    );
  });

  test('a card with a time becomes overdue at that minute', () => {
    const cardDue = { dueDate: '2026-11-05', dueTime: '18:30' };
    expect(isCardDueOverdue(cardDue, localMoment(11, 5, 18, 29))).toBe(false);
    expect(isCardDueOverdue(cardDue, localMoment(11, 5, 18, 30))).toBe(true);
  });

  test('the last day of a month rolls over to the next month', () => {
    const cardDue = { dueDate: '2026-11-30', dueTime: null };
    expect(isCardDueOverdue(cardDue, localMoment(11, 30, 23, 59))).toBe(false);
    expect(isCardDueOverdue(cardDue, localMoment(12, 1))).toBe(true);
  });
});

describe('formatCardDue', () => {
  const now = localMoment(11, 3, 15, 0);

  test.each([
    ['2026-11-02', 'Yesterday'],
    ['2026-11-03', 'Today'],
    ['2026-11-04', 'Tomorrow'],
    ['2026-11-12', 'Nov 12'],
    ['2027-01-04', 'Jan 4, 2027'],
  ])('shows %s as %j', (dueDate, expectedText) => {
    expect(formatCardDue({ dueDate, dueTime: null }, now)).toBe(expectedText);
  });

  test('adds the time after the day when there is one', () => {
    expect(formatCardDue({ dueDate: '2026-11-03', dueTime: '18:00' }, now)).toBe('Today, 18:00');
    expect(formatCardDue({ dueDate: '2026-11-12', dueTime: '09:15' }, now)).toBe('Nov 12, 09:15');
  });
});
