import { describe, expect, test } from 'vitest';
import { readFormMoment } from '@/features/calendar/entities/form-moment';

const formWith = (fieldValues: Record<string, string>) => {
  const submittedForm = new FormData();
  for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
    submittedForm.set(fieldName, fieldValue);
  }
  return submittedForm;
};

describe('readFormMoment', () => {
  test('joins the day and the time as a moment in the calendar zone', () => {
    const startsForm = formWith({ 'starts-day': '2026-11-06', 'starts-time': '07:30' });

    expect(readFormMoment(startsForm, 'starts', 'America/Los_Angeles')).toEqual(
      new Date(2026, 10, 6, 7, 30),
    );
    expect(readFormMoment(startsForm, 'starts', 'Asia/Manila')).toEqual(
      new Date('2026-11-05T23:30:00Z'),
    );
  });

  test('an empty day or time gives an invalid moment', () => {
    for (const fieldValues of [
      { 'starts-day': '', 'starts-time': '07:30' },
      { 'starts-day': '2026-11-06', 'starts-time': '' },
    ]) {
      expect(
        Number.isNaN(readFormMoment(formWith(fieldValues), 'starts', 'Asia/Manila').getTime()),
      ).toBe(true);
    }
  });
});
