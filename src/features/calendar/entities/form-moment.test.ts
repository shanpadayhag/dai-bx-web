import { describe, expect, test } from 'vitest';
import { readFormCategoryId, readFormMoment } from '@/features/calendar/entities/form-moment';

const formWith = (fieldValues: Record<string, string>) => {
  const submittedForm = new FormData();
  for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
    submittedForm.set(fieldName, fieldValue);
  }
  return submittedForm;
};

describe('readFormMoment', () => {
  test('joins the day and the time as a local moment', () => {
    expect(
      readFormMoment(formWith({ 'starts-day': '2026-11-06', 'starts-time': '07:30' }), 'starts'),
    ).toEqual(new Date(2026, 10, 6, 7, 30));
  });

  test('an empty day or time gives an invalid moment', () => {
    for (const fieldValues of [
      { 'starts-day': '', 'starts-time': '07:30' },
      { 'starts-day': '2026-11-06', 'starts-time': '' },
    ]) {
      expect(Number.isNaN(readFormMoment(formWith(fieldValues), 'starts').getTime())).toBe(true);
    }
  });
});

describe('readFormCategoryId', () => {
  test('None reads as no category', () => {
    expect(readFormCategoryId(formWith({ category: '' }), 'category')).toBeNull();
    expect(readFormCategoryId(formWith({ category: 'focus' }), 'category')).toBe('focus');
  });
});
