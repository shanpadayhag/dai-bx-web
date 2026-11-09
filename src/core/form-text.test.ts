import { describe, expect, test } from 'vitest';
import readFormText, { readFormCategoryId, readFormRepeatRule } from '@/core/form-text';

const formWith = (fieldValues: Record<string, string>) => {
  const submittedForm = new FormData();
  for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
    submittedForm.set(fieldName, fieldValue);
  }
  return submittedForm;
};

describe('readFormText', () => {
  test('a missing field reads as empty', () => {
    expect(readFormText(formWith({ title: 'Gym' }), 'title')).toBe('Gym');
    expect(readFormText(formWith({}), 'title')).toBe('');
  });
});

describe('readFormCategoryId', () => {
  test('None reads as no category', () => {
    expect(readFormCategoryId(formWith({ category: '' }), 'category')).toBeNull();
    expect(readFormCategoryId(formWith({ category: 'focus' }), 'category')).toBe('focus');
  });
});

describe('readFormRepeatRule', () => {
  test('reads the chosen rule, or none', () => {
    const weeklyRule = {
      frequency: 'weekly',
      interval: 1,
      weekdays: ['mon'],
      ends: { never: true },
    };

    expect(readFormRepeatRule(formWith({ repeat: JSON.stringify(weeklyRule) }), 'repeat')).toEqual(
      weeklyRule,
    );
    expect(readFormRepeatRule(formWith({ repeat: '' }), 'repeat')).toBeNull();
  });
});
