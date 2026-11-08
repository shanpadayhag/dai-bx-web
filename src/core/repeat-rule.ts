type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type RepeatFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

type MonthWeek = 1 | 2 | 3 | 4 | -1;

type MonthlyRepeat = { day: number } | { week: MonthWeek; weekday: Weekday };

type RepeatEnd = { never: true } | { onDate: string } | { after: number };

type RepeatRule = {
  frequency: RepeatFrequency;
  interval: number;
  weekdays?: Weekday[];
  monthly?: MonthlyRepeat;
  ends: RepeatEnd;
};

type RepeatPresetKey = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays' | 'custom';

type RepeatPreset = { key: RepeatPresetKey; label: string; rule: RepeatRule | null };

type CustomRepeatDraft = {
  interval: number;
  frequency: RepeatFrequency;
  weekdays: Weekday[];
  monthlyMode: 'day' | 'weekday';
  endMode: 'never' | 'onDate' | 'after';
  endDate: string;
  endCount: number;
};

const WEEKDAYS_IN_ORDER: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const WORKING_WEEKDAYS: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

const WEEKDAY_NAMES: Record<Weekday, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const MONTH_WEEK_NAMES: Record<MonthWeek, string> = {
  1: 'first',
  2: 'second',
  3: 'third',
  4: 'fourth',
  [-1]: 'last',
};

const FREQUENCY_UNITS: Record<RepeatFrequency, string> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
};

const FREQUENCY_ADVERBS: Record<RepeatFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Annually',
};

const NEVER_ENDING: RepeatEnd = { never: true };
const DEFAULT_END_COUNT = 13;
const DEFAULT_END_MONTHS = 3;

const dayMonthFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

const dayMonthYearFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const utcDateOf = (calendarDate: string): Date => new Date(`${calendarDate}T00:00:00Z`);

const calendarDateOf = (utcDate: Date): string => utcDate.toISOString().slice(0, 10);

const weekdayOf = (calendarDate: string): Weekday => {
  const sundayFirstIndex = utcDateOf(calendarDate).getUTCDay();
  return WEEKDAYS_IN_ORDER[(sundayFirstIndex + 6) % 7] ?? 'mon';
};

const dayOfMonthOf = (calendarDate: string): number => utcDateOf(calendarDate).getUTCDate();

const monthWeekOf = (calendarDate: string): MonthWeek => {
  const weekIndex = Math.ceil(dayOfMonthOf(calendarDate) / 7);
  return weekIndex >= 5 ? -1 : (weekIndex as MonthWeek);
};

const sortedWeekdays = (weekdays: readonly Weekday[]): Weekday[] =>
  WEEKDAYS_IN_ORDER.filter((weekday) => weekdays.includes(weekday));

const joinWithAnd = (words: readonly string[]): string =>
  words.length <= 1 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;

const clampWholeNumber = (enteredNumber: number, lowest: number, highest: number): number =>
  Number.isFinite(enteredNumber)
    ? Math.min(highest, Math.max(lowest, Math.round(enteredNumber)))
    : lowest;

const addMonths = (calendarDate: string, monthCount: number): string => {
  const shiftedDate = utcDateOf(calendarDate);
  shiftedDate.setUTCMonth(shiftedDate.getUTCMonth() + monthCount);
  return calendarDateOf(shiftedDate);
};

const describeMonthly = (monthlyRepeat: MonthlyRepeat): string =>
  'day' in monthlyRepeat
    ? `on day ${monthlyRepeat.day}`
    : `on the ${MONTH_WEEK_NAMES[monthlyRepeat.week]} ${WEEKDAY_NAMES[monthlyRepeat.weekday]}`;

const describeEnd = (repeatEnd: RepeatEnd): string => {
  if ('onDate' in repeatEnd)
    return `, until ${dayMonthYearFormat.format(utcDateOf(repeatEnd.onDate))}`;
  if ('after' in repeatEnd) return repeatEnd.after === 1 ? ', once' : `, ${repeatEnd.after} times`;
  return '';
};

const isEveryWorkingWeekday = (weekdays: readonly Weekday[]): boolean =>
  weekdays.length === WORKING_WEEKDAYS.length &&
  WORKING_WEEKDAYS.every((weekday) => weekdays.includes(weekday));

const describeCadence = (repeatRule: RepeatRule, firstDate: string): string => {
  if (
    repeatRule.frequency === 'weekly' &&
    repeatRule.interval === 1 &&
    isEveryWorkingWeekday(repeatRule.weekdays ?? [])
  ) {
    return 'Every weekday (Monday to Friday)';
  }
  const unit = FREQUENCY_UNITS[repeatRule.frequency];
  const lead =
    repeatRule.interval === 1
      ? FREQUENCY_ADVERBS[repeatRule.frequency]
      : `Every ${repeatRule.interval} ${unit}s`;
  if (repeatRule.frequency === 'weekly') {
    const weekdayNames = sortedWeekdays(repeatRule.weekdays ?? [weekdayOf(firstDate)]).map(
      (weekday) => WEEKDAY_NAMES[weekday],
    );
    return `${lead} on ${joinWithAnd(weekdayNames)}`;
  }
  if (repeatRule.frequency === 'monthly') {
    return `${lead} ${describeMonthly(repeatRule.monthly ?? { day: dayOfMonthOf(firstDate) })}`;
  }
  if (repeatRule.frequency === 'yearly') {
    return `${lead} on ${dayMonthFormat.format(utcDateOf(firstDate))}`;
  }
  return lead;
};

const describeRepeatRule = (repeatRule: RepeatRule, firstDate: string): string =>
  `${describeCadence(repeatRule, firstDate)}${describeEnd(repeatRule.ends)}`;

const repeatPresetsFor = (firstDate: string): RepeatPreset[] => {
  const presetRules: { key: Exclude<RepeatPresetKey, 'none' | 'custom'>; rule: RepeatRule }[] = [
    { key: 'daily', rule: { frequency: 'daily', interval: 1, ends: NEVER_ENDING } },
    {
      key: 'weekly',
      rule: {
        frequency: 'weekly',
        interval: 1,
        weekdays: [weekdayOf(firstDate)],
        ends: NEVER_ENDING,
      },
    },
    {
      key: 'monthly',
      rule: {
        frequency: 'monthly',
        interval: 1,
        monthly: { week: monthWeekOf(firstDate), weekday: weekdayOf(firstDate) },
        ends: NEVER_ENDING,
      },
    },
    { key: 'yearly', rule: { frequency: 'yearly', interval: 1, ends: NEVER_ENDING } },
    {
      key: 'weekdays',
      rule: {
        frequency: 'weekly',
        interval: 1,
        weekdays: [...WORKING_WEEKDAYS],
        ends: NEVER_ENDING,
      },
    },
  ];
  return [
    { key: 'none', label: 'Does not repeat', rule: null },
    ...presetRules.map((presetRule) => ({
      key: presetRule.key,
      label: describeRepeatRule(presetRule.rule, firstDate),
      rule: presetRule.rule,
    })),
    { key: 'custom', label: 'Custom…', rule: null },
  ];
};

const normalisedRule = (repeatRule: RepeatRule): RepeatRule => ({
  ...repeatRule,
  ...(repeatRule.weekdays === undefined ? {} : { weekdays: sortedWeekdays(repeatRule.weekdays) }),
});

const repeatPresetKeyOf = (repeatRule: RepeatRule | null, firstDate: string): RepeatPresetKey => {
  if (repeatRule === null) return 'none';
  const comparedRule = JSON.stringify(normalisedRule(repeatRule));
  const matchingPreset = repeatPresetsFor(firstDate).find(
    (preset) =>
      preset.rule !== null && JSON.stringify(normalisedRule(preset.rule)) === comparedRule,
  );
  return matchingPreset?.key ?? 'custom';
};

const customRepeatDraftOf = (
  repeatRule: RepeatRule | null,
  firstDate: string,
): CustomRepeatDraft => {
  const ruleEnd = repeatRule?.ends ?? NEVER_ENDING;
  return {
    interval: repeatRule?.interval ?? 1,
    frequency: repeatRule?.frequency ?? 'weekly',
    weekdays: sortedWeekdays(repeatRule?.weekdays ?? [weekdayOf(firstDate)]),
    monthlyMode:
      repeatRule?.monthly !== undefined && 'week' in repeatRule.monthly ? 'weekday' : 'day',
    endMode: 'onDate' in ruleEnd ? 'onDate' : 'after' in ruleEnd ? 'after' : 'never',
    endDate: 'onDate' in ruleEnd ? ruleEnd.onDate : addMonths(firstDate, DEFAULT_END_MONTHS),
    endCount: 'after' in ruleEnd ? ruleEnd.after : DEFAULT_END_COUNT,
  };
};

const repeatEndOf = (customDraft: CustomRepeatDraft): RepeatEnd => {
  if (customDraft.endMode === 'onDate') return { onDate: customDraft.endDate };
  if (customDraft.endMode === 'after') {
    return { after: clampWholeNumber(customDraft.endCount, 1, 999) };
  }
  return NEVER_ENDING;
};

const repeatRuleFromCustomDraft = (
  customDraft: CustomRepeatDraft,
  firstDate: string,
): RepeatRule => {
  const interval = clampWholeNumber(customDraft.interval, 1, 99);
  const ends = repeatEndOf(customDraft);
  if (customDraft.frequency === 'weekly') {
    const weekdays =
      customDraft.weekdays.length === 0 ? [weekdayOf(firstDate)] : customDraft.weekdays;
    return { frequency: 'weekly', interval, weekdays: sortedWeekdays(weekdays), ends };
  }
  if (customDraft.frequency === 'monthly') {
    const monthly: MonthlyRepeat =
      customDraft.monthlyMode === 'weekday'
        ? { week: monthWeekOf(firstDate), weekday: weekdayOf(firstDate) }
        : { day: dayOfMonthOf(firstDate) };
    return { frequency: 'monthly', interval, monthly, ends };
  }
  return { frequency: customDraft.frequency, interval, ends };
};

export type {
  CustomRepeatDraft,
  MonthlyRepeat,
  RepeatEnd,
  RepeatFrequency,
  RepeatPreset,
  RepeatPresetKey,
  RepeatRule,
  Weekday,
};
export {
  FREQUENCY_UNITS,
  WEEKDAY_NAMES,
  WEEKDAYS_IN_ORDER,
  customRepeatDraftOf,
  dayOfMonthOf,
  describeMonthly,
  describeRepeatRule,
  monthWeekOf,
  repeatPresetKeyOf,
  repeatPresetsFor,
  repeatRuleFromCustomDraft,
  weekdayOf,
};
