import type { InputHTMLAttributes, KeyboardEvent } from 'react';
import Input from '@/core/components/atoms/input';

type InlineNameInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'defaultValue' | 'onBlur' | 'onKeyDown'
> & {
  currentName: string;
  onCommitName: (enteredName: string) => void;
};

const finishOnKey = (keyEvent: KeyboardEvent<HTMLInputElement>, currentName: string) => {
  if (keyEvent.key === 'Enter') {
    keyEvent.preventDefault();
    keyEvent.currentTarget.blur();
  }
  if (keyEvent.key === 'Escape') {
    keyEvent.preventDefault();
    keyEvent.currentTarget.value = currentName;
    keyEvent.currentTarget.blur();
  }
};

const InlineNameInput = ({ currentName, onCommitName, ...inputProps }: InlineNameInputProps) => (
  <Input
    key={currentName}
    defaultValue={currentName}
    onKeyDown={(keyEvent) => finishOnKey(keyEvent, currentName)}
    onBlur={(blurEvent) => {
      const enteredName = blurEvent.currentTarget.value.trim();
      if (enteredName === currentName) return;
      if (enteredName === '') {
        blurEvent.currentTarget.value = currentName;
        return;
      }
      onCommitName(enteredName);
    }}
    {...inputProps}
  />
);

export default InlineNameInput;
