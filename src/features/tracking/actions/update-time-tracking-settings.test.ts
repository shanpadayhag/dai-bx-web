import { expect, test } from 'vitest';
import {
  readCheckInMinutes,
  readClockTime,
} from '@/features/tracking/actions/update-time-tracking-settings';

test('check-ins are whole minutes from 5 to 240', () => {
  expect(readCheckInMinutes('5')).toBe(5);
  expect(readCheckInMinutes(' 240 ')).toBe(240);
  for (const refusedText of ['', '4', '241', '12.5', 'soon']) {
    expect(() => readCheckInMinutes(refusedText), refusedText).toThrow('Check the minutes');
  }
});

test('working hours are a time of day', () => {
  expect(readClockTime('02:00')).toBe('02:00');
  expect(readClockTime('23:59')).toBe('23:59');
  for (const refusedText of ['', '24:00', '9:30', '12:60']) {
    expect(() => readClockTime(refusedText), refusedText).toThrow('Pick a time');
  }
});
