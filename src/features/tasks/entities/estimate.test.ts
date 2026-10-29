import { describe, expect, test } from 'vitest';
import { formatEstimate, parseEstimate } from '@/features/tasks/entities/estimate';

describe('parseEstimate', () => {
  test.each([
    ['45m', 45],
    ['2h', 120],
    ['1h 30m', 90],
    ['1h30m', 90],
    [' 2H 5M ', 125],
    ['90', 90],
    ['24h', 1440],
    ['1m', 1],
  ])('reads %j as %i minutes', (estimateText, expectedMinutes) => {
    expect(parseEstimate(estimateText)).toEqual({ kind: 'minutes', minutes: expectedMinutes });
  });

  test('reads a blank field as clearing the estimate', () => {
    expect(parseEstimate('   ')).toEqual({ kind: 'empty' });
  });

  test.each(['soon', '1.5h', 'h', '30m 1h', '0m', '24h 1m', '-5m', '2 hours'])(
    'refuses %j',
    (estimateText) => {
      expect(parseEstimate(estimateText)).toEqual({ kind: 'invalid' });
    },
  );
});

describe('formatEstimate', () => {
  test.each([
    [45, '45m'],
    [120, '2h'],
    [90, '1h 30m'],
    [1440, '24h'],
  ])('writes %i minutes as %j', (estimateMinutes, expectedText) => {
    expect(formatEstimate(estimateMinutes)).toBe(expectedText);
  });

  test('writes no estimate as an empty string', () => {
    expect(formatEstimate(null)).toBe('');
  });
});
