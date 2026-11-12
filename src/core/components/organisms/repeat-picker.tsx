'use client';

import { useState } from 'react';
import Select from '@/core/components/atoms/select';
import Field from '@/core/components/molecules/field';
import CustomRepeatDialog from '@/core/components/organisms/custom-repeat-dialog';
import { showPopover } from '@/core/popover';
import {
  describeRepeatRule,
  repeatPresetKeyOf,
  repeatPresetsFor,
  type RepeatRule,
} from '@/core/repeat-rule';

type RepeatPickerProps = {
  idPrefix: string;
  name: string;
  firstDate: string;
  initialRule: RepeatRule | null;
  isRepeatRequired?: boolean;
  label?: string;
  noRepeatLabel?: string;
  onChooseRule?: (chosenRule: RepeatRule | null) => void;
};

const CHOSEN_CUSTOM_VALUE = 'chosen-custom';

const RepeatPicker = ({
  idPrefix,
  name,
  firstDate,
  initialRule,
  isRepeatRequired = false,
  label = 'Repeat',
  noRepeatLabel,
  onChooseRule,
}: RepeatPickerProps) => {
  const [chosenRule, setChosenRule] = useState<RepeatRule | null>(initialRule);
  const [shownFirstDate, setShownFirstDate] = useState(firstDate);
  if (shownFirstDate !== firstDate) {
    setShownFirstDate(firstDate);
    const shownPresetKey = repeatPresetKeyOf(chosenRule, shownFirstDate);
    if (shownPresetKey !== 'custom' && shownPresetKey !== 'none') {
      const followingRule =
        repeatPresetsFor(firstDate).find((preset) => preset.key === shownPresetKey)?.rule ?? null;
      setChosenRule(followingRule);
    }
  }
  const customDialogId = `${idPrefix}-custom-repeat`;
  const repeatPresets = repeatPresetsFor(firstDate)
    .filter((repeatPreset) => !isRepeatRequired || repeatPreset.key !== 'none')
    .map((repeatPreset) =>
      repeatPreset.key === 'none' && noRepeatLabel !== undefined
        ? { ...repeatPreset, label: noRepeatLabel }
        : repeatPreset,
    );
  const chosenPresetKey = repeatPresetKeyOf(chosenRule, firstDate);
  const isCustomRule = chosenRule !== null && chosenPresetKey === 'custom';

  const chooseRule = (nextRule: RepeatRule | null) => {
    setChosenRule(nextRule);
    onChooseRule?.(nextRule);
  };

  return (
    <>
      <Field label={label} htmlFor={`${idPrefix}-repeat`}>
        <Select
          id={`${idPrefix}-repeat`}
          value={isCustomRule ? CHOSEN_CUSTOM_VALUE : chosenPresetKey}
          onChange={(changeEvent) => {
            const pickedValue = changeEvent.currentTarget.value;
            if (pickedValue === 'custom') {
              showPopover(customDialogId);
              return;
            }
            if (pickedValue === CHOSEN_CUSTOM_VALUE) return;
            chooseRule(repeatPresets.find((preset) => preset.key === pickedValue)?.rule ?? null);
          }}
        >
          {repeatPresets.map((preset) =>
            preset.key === 'custom' && isCustomRule ? (
              [
                <option key={CHOSEN_CUSTOM_VALUE} value={CHOSEN_CUSTOM_VALUE}>
                  {describeRepeatRule(chosenRule, firstDate)}
                </option>,
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>,
              ]
            ) : (
              <option key={preset.key} value={preset.key}>
                {preset.label}
              </option>
            ),
          )}
        </Select>
      </Field>
      <input
        type="hidden"
        name={name}
        value={chosenRule === null ? '' : JSON.stringify(chosenRule)}
      />
      <CustomRepeatDialog
        id={customDialogId}
        idPrefix={`${idPrefix}-custom`}
        firstDate={firstDate}
        repeatRule={chosenRule}
        onAnswer={(answeredRule) => {
          if (answeredRule !== null) chooseRule(answeredRule);
        }}
      />
    </>
  );
};

export default RepeatPicker;
