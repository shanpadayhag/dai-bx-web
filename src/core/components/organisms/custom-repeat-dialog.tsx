'use client';

import { useEffect, useRef, useState } from 'react';
import joinClassNames from '@/core/class-names';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Select from '@/core/components/atoms/select';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import {
  FREQUENCY_UNITS,
  WEEKDAY_NAMES,
  WEEKDAYS_IN_ORDER,
  customRepeatDraftOf,
  dayOfMonthOf,
  describeMonthly,
  monthWeekOf,
  repeatRuleFromCustomDraft,
  weekdayOf,
  type CustomRepeatDraft,
  type RepeatFrequency,
  type RepeatRule,
} from '@/core/repeat-rule';

type CustomRepeatDialogProps = {
  id: string;
  idPrefix: string;
  firstDate: string;
  repeatRule: RepeatRule | null;
  onAnswer: (chosenRule: RepeatRule | null) => void;
};

const FREQUENCIES: readonly RepeatFrequency[] = ['daily', 'weekly', 'monthly', 'yearly'];

const radioRowClassName =
  'flex min-h-10 cursor-pointer items-center gap-3 text-sm text-foreground [&_input[type=radio]]:size-4 [&_input[type=radio]]:accent-primary';

const CustomRepeatDialog = ({
  id,
  idPrefix,
  firstDate,
  repeatRule,
  onAnswer,
}: CustomRepeatDialogProps) => {
  const [customDraft, setCustomDraft] = useState<CustomRepeatDraft>(() =>
    customRepeatDraftOf(repeatRule, firstDate),
  );
  const chosenRuleRef = useRef<RepeatRule | null>(null);
  const onAnswerRef = useRef(onAnswer);
  const repeatRuleRef = useRef(repeatRule);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
    repeatRuleRef.current = repeatRule;
  }, [onAnswer, repeatRule]);

  useEffect(() => {
    const dialogElement = document.getElementById(id);
    const answerOnToggle = (toggleEvent: Event) => {
      if ((toggleEvent as ToggleEvent).newState === 'open') {
        chosenRuleRef.current = null;
        setCustomDraft(customRepeatDraftOf(repeatRuleRef.current, firstDate));
        return;
      }
      onAnswerRef.current(chosenRuleRef.current);
    };
    dialogElement?.addEventListener('toggle', answerOnToggle);
    return () => dialogElement?.removeEventListener('toggle', answerOnToggle);
  }, [firstDate, id]);

  const updateDraft = (draftChange: Partial<CustomRepeatDraft>) =>
    setCustomDraft((currentDraft) => ({ ...currentDraft, ...draftChange }));

  const toggleWeekday = (weekday: (typeof WEEKDAYS_IN_ORDER)[number]) =>
    setCustomDraft((currentDraft) => ({
      ...currentDraft,
      weekdays: currentDraft.weekdays.includes(weekday)
        ? currentDraft.weekdays.filter((tickedWeekday) => tickedWeekday !== weekday)
        : [...currentDraft.weekdays, weekday],
    }));

  const isPlural = customDraft.interval !== 1;
  const firstWeekday = weekdayOf(firstDate);

  return (
    <PopoverPanel id={id} label="Custom repeat" className="w-[min(380px,calc(100vw-2rem))]">
      <div className="grid gap-5 p-5">
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-foreground">Custom repeat</h2>
        <div className="grid gap-1.5">
          <label
            htmlFor={`${idPrefix}-interval`}
            className="text-[13px] font-medium text-foreground"
          >
            Repeat every
          </label>
          <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2">
            <Input
              id={`${idPrefix}-interval`}
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              value={customDraft.interval}
              onChange={(changeEvent) =>
                updateDraft({ interval: Number(changeEvent.currentTarget.value) })
              }
              className="tabular-nums"
            />
            <Select
              aria-label="Repeat unit"
              value={customDraft.frequency}
              onChange={(changeEvent) =>
                updateDraft({ frequency: changeEvent.currentTarget.value as RepeatFrequency })
              }
            >
              {FREQUENCIES.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {FREQUENCY_UNITS[frequency]}
                  {isPlural ? 's' : ''}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {customDraft.frequency === 'weekly' ? (
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-[13px] font-medium text-foreground">Repeat on</legend>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS_IN_ORDER.map((weekday) => {
                const isTicked = customDraft.weekdays.includes(weekday);
                return (
                  <button
                    key={weekday}
                    type="button"
                    aria-pressed={isTicked}
                    aria-label={WEEKDAY_NAMES[weekday]}
                    onClick={() => toggleWeekday(weekday)}
                    className={joinClassNames(
                      'inline-flex size-9 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-150 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:outline-none',
                      isTicked
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-strong text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {WEEKDAY_NAMES[weekday].slice(0, 1)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}
        {customDraft.frequency === 'monthly' ? (
          <Select
            aria-label="Monthly on"
            value={customDraft.monthlyMode}
            onChange={(changeEvent) =>
              updateDraft({ monthlyMode: changeEvent.currentTarget.value as 'day' | 'weekday' })
            }
          >
            <option value="day">Monthly {describeMonthly({ day: dayOfMonthOf(firstDate) })}</option>
            <option value="weekday">
              Monthly {describeMonthly({ week: monthWeekOf(firstDate), weekday: firstWeekday })}
            </option>
          </Select>
        ) : null}
        <fieldset className="grid gap-1">
          <legend className="mb-1.5 text-[13px] font-medium text-foreground">Ends</legend>
          <label className={radioRowClassName}>
            <input
              type="radio"
              name={`${idPrefix}-ends`}
              checked={customDraft.endMode === 'never'}
              onChange={() => updateDraft({ endMode: 'never' })}
            />
            Never
          </label>
          <div className={radioRowClassName}>
            <input
              id={`${idPrefix}-ends-on`}
              type="radio"
              name={`${idPrefix}-ends`}
              checked={customDraft.endMode === 'onDate'}
              onChange={() => updateDraft({ endMode: 'onDate' })}
            />
            <label htmlFor={`${idPrefix}-ends-on`} className="w-12 cursor-pointer">
              On
            </label>
            <Input
              type="date"
              aria-label="Ends on"
              value={customDraft.endDate}
              disabled={customDraft.endMode !== 'onDate'}
              onChange={(changeEvent) => updateDraft({ endDate: changeEvent.currentTarget.value })}
              className="h-9 flex-1 tabular-nums disabled:opacity-50"
            />
          </div>
          <div className={radioRowClassName}>
            <input
              id={`${idPrefix}-ends-after`}
              type="radio"
              name={`${idPrefix}-ends`}
              checked={customDraft.endMode === 'after'}
              onChange={() => updateDraft({ endMode: 'after' })}
            />
            <label htmlFor={`${idPrefix}-ends-after`} className="w-12 cursor-pointer">
              After
            </label>
            <Input
              type="number"
              inputMode="numeric"
              aria-label="Number of times"
              min={1}
              max={999}
              value={customDraft.endCount}
              disabled={customDraft.endMode !== 'after'}
              onChange={(changeEvent) =>
                updateDraft({ endCount: Number(changeEvent.currentTarget.value) })
              }
              isFullWidth={false}
              className="h-9 w-20 tabular-nums disabled:opacity-50"
            />
            <span className="text-muted-foreground">
              {customDraft.endCount === 1 ? 'time' : 'times'}
            </span>
          </div>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" popoverTarget={id} popoverTargetAction="hide">
            Cancel
          </Button>
          <Button
            popoverTarget={id}
            popoverTargetAction="hide"
            onClick={() => {
              chosenRuleRef.current = repeatRuleFromCustomDraft(customDraft, firstDate);
            }}
          >
            Done
          </Button>
        </div>
      </div>
    </PopoverPanel>
  );
};

export default CustomRepeatDialog;
