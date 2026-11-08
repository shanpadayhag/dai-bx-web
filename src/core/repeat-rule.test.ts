import { describe, expect, test } from 'vitest';
import {
  customRepeatDraftOf,
  describeRepeatRule,
  repeatPresetKeyOf,
  repeatPresetsFor,
  repeatRuleFromCustomDraft,
  type RepeatRule,
} from '@/core/repeat-rule';

const MONDAY_NINTH_NOVEMBER = '2026-11-09';
const LAST_FRIDAY_OF_OCTOBER = '2026-10-30';

const never = { never: true } as const;

describe('repeatPresetsFor', () => {
  test('names the presets after the first day, the way Google Calendar does', () => {
    expect(repeatPresetsFor(MONDAY_NINTH_NOVEMBER).map((preset) => preset.label)).toEqual([
      'Does not repeat',
      'Daily',
      'Weekly on Monday',
      'Monthly on the second Monday',
      'Annually on 9 November',
      'Every weekday (Monday to Friday)',
      'Custom…',
    ]);
  });

  test('calls a fifth weekday of the month the last one', () => {
    const monthlyPreset = repeatPresetsFor('2026-11-30').find((preset) => preset.key === 'monthly');
    expect(monthlyPreset?.label).toBe('Monthly on the last Monday');
  });

  test('builds the rule each preset stands for', () => {
    const rulesByKey = new Map(
      repeatPresetsFor(MONDAY_NINTH_NOVEMBER).map((preset) => [preset.key, preset.rule]),
    );
    expect(rulesByKey.get('none')).toBeNull();
    expect(rulesByKey.get('daily')).toEqual({ frequency: 'daily', interval: 1, ends: never });
    expect(rulesByKey.get('weekly')).toEqual({
      frequency: 'weekly',
      interval: 1,
      weekdays: ['mon'],
      ends: never,
    });
    expect(rulesByKey.get('monthly')).toEqual({
      frequency: 'monthly',
      interval: 1,
      monthly: { week: 2, weekday: 'mon' },
      ends: never,
    });
    expect(rulesByKey.get('yearly')).toEqual({ frequency: 'yearly', interval: 1, ends: never });
    expect(rulesByKey.get('weekdays')).toEqual({
      frequency: 'weekly',
      interval: 1,
      weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      ends: never,
    });
  });
});

describe('repeatPresetKeyOf', () => {
  test('finds the preset a rule came from', () => {
    for (const preset of repeatPresetsFor(MONDAY_NINTH_NOVEMBER)) {
      if (preset.key === 'custom') continue;
      expect(repeatPresetKeyOf(preset.rule, MONDAY_NINTH_NOVEMBER)).toBe(preset.key);
    }
  });

  test('calls any other rule custom', () => {
    const everyOtherWeek: RepeatRule = {
      frequency: 'weekly',
      interval: 2,
      weekdays: ['mon'],
      ends: never,
    };
    const weeklyForTenWeeks: RepeatRule = {
      frequency: 'weekly',
      interval: 1,
      weekdays: ['mon'],
      ends: { after: 10 },
    };
    expect(repeatPresetKeyOf(everyOtherWeek, MONDAY_NINTH_NOVEMBER)).toBe('custom');
    expect(repeatPresetKeyOf(weeklyForTenWeeks, MONDAY_NINTH_NOVEMBER)).toBe('custom');
  });

  test('keeps the weekly preset when the weekdays are written in another order', () => {
    const weekdaysOutOfOrder: RepeatRule = {
      frequency: 'weekly',
      interval: 1,
      weekdays: ['fri', 'mon', 'wed', 'tue', 'thu'],
      ends: never,
    };
    expect(repeatPresetKeyOf(weekdaysOutOfOrder, MONDAY_NINTH_NOVEMBER)).toBe('weekdays');
  });
});

describe('custom repeat drafts', () => {
  test('a new custom repeat starts weekly on the first day’s weekday, never ending', () => {
    expect(customRepeatDraftOf(null, MONDAY_NINTH_NOVEMBER)).toEqual({
      interval: 1,
      frequency: 'weekly',
      weekdays: ['mon'],
      monthlyMode: 'day',
      endMode: 'never',
      endDate: '2027-02-09',
      endCount: 13,
    });
  });

  test('round-trips every kind of rule through the custom dialog', () => {
    const customRules: RepeatRule[] = [
      { frequency: 'daily', interval: 3, ends: { after: 5 } },
      { frequency: 'weekly', interval: 2, weekdays: ['mon', 'thu'], ends: never },
      { frequency: 'monthly', interval: 1, monthly: { day: 9 }, ends: { onDate: '2027-03-31' } },
      { frequency: 'monthly', interval: 6, monthly: { week: 2, weekday: 'mon' }, ends: never },
      { frequency: 'yearly', interval: 1, ends: { after: 3 } },
    ];
    for (const customRule of customRules) {
      const customDraft = customRepeatDraftOf(customRule, MONDAY_NINTH_NOVEMBER);
      expect(repeatRuleFromCustomDraft(customDraft, MONDAY_NINTH_NOVEMBER)).toEqual(customRule);
    }
  });

  test('a monthly draft by weekday takes its week from the first day, last for a fifth week', () => {
    const lastFridayDraft = {
      ...customRepeatDraftOf(null, LAST_FRIDAY_OF_OCTOBER),
      frequency: 'monthly' as const,
      monthlyMode: 'weekday' as const,
    };
    expect(repeatRuleFromCustomDraft(lastFridayDraft, LAST_FRIDAY_OF_OCTOBER)).toEqual({
      frequency: 'monthly',
      interval: 1,
      monthly: { week: -1, weekday: 'fri' },
      ends: never,
    });
  });

  test('a weekly draft with no weekday ticked falls back to the first day’s weekday', () => {
    const emptyWeekdaysDraft = {
      ...customRepeatDraftOf(null, MONDAY_NINTH_NOVEMBER),
      weekdays: [],
    };
    expect(repeatRuleFromCustomDraft(emptyWeekdaysDraft, MONDAY_NINTH_NOVEMBER)).toMatchObject({
      weekdays: ['mon'],
    });
  });

  test('clamps the interval to 1–99 and the count to 1–999', () => {
    const outOfRangeDraft = {
      ...customRepeatDraftOf(null, MONDAY_NINTH_NOVEMBER),
      frequency: 'daily' as const,
      interval: 400,
      endMode: 'after' as const,
      endCount: 0,
    };
    expect(repeatRuleFromCustomDraft(outOfRangeDraft, MONDAY_NINTH_NOVEMBER)).toEqual({
      frequency: 'daily',
      interval: 99,
      ends: { after: 1 },
    });
  });
});

describe('describeRepeatRule', () => {
  test('describes presets with their own label', () => {
    for (const preset of repeatPresetsFor(MONDAY_NINTH_NOVEMBER)) {
      if (preset.rule === null) continue;
      expect(describeRepeatRule(preset.rule, MONDAY_NINTH_NOVEMBER)).toBe(preset.label);
    }
  });

  test('describes custom rules in a short sentence', () => {
    expect(
      describeRepeatRule(
        { frequency: 'weekly', interval: 1, weekdays: ['thu', 'mon'], ends: never },
        MONDAY_NINTH_NOVEMBER,
      ),
    ).toBe('Weekly on Monday and Thursday');
    expect(
      describeRepeatRule(
        { frequency: 'weekly', interval: 2, weekdays: ['mon', 'wed', 'fri'], ends: never },
        MONDAY_NINTH_NOVEMBER,
      ),
    ).toBe('Every 2 weeks on Monday, Wednesday and Friday');
    expect(
      describeRepeatRule(
        { frequency: 'daily', interval: 3, ends: { after: 5 } },
        MONDAY_NINTH_NOVEMBER,
      ),
    ).toBe('Every 3 days, 5 times');
    expect(
      describeRepeatRule(
        {
          frequency: 'monthly',
          interval: 1,
          monthly: { day: 31 },
          ends: { onDate: '2027-03-31' },
        },
        MONDAY_NINTH_NOVEMBER,
      ),
    ).toBe('Monthly on day 31, until 31 March 2027');
    expect(
      describeRepeatRule(
        { frequency: 'yearly', interval: 1, ends: { after: 1 } },
        MONDAY_NINTH_NOVEMBER,
      ),
    ).toBe('Annually on 9 November, once');
  });
});
