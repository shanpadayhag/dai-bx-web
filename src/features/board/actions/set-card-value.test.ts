import { describe, expect, it } from 'vitest';
import AppError from '@/core/app-error';
import { readCardValueInput } from '@/features/board/actions/set-card-value';
import BoardPropertyKind from '@/features/board/enums/board-property-kind';

describe('readCardValueInput', () => {
  it('reads each kind into the shape the server takes', () => {
    expect(readCardValueInput(BoardPropertyKind.Choice, 'option-daibx')).toEqual({
      optionId: 'option-daibx',
    });
    expect(readCardValueInput(BoardPropertyKind.Text, '  ship it ')).toEqual({ text: 'ship it' });
    expect(readCardValueInput(BoardPropertyKind.Number, '-2.50')).toEqual({ number: '-2.50' });
  });

  it('reads an empty entry as clearing the value', () => {
    expect(readCardValueInput(BoardPropertyKind.Number, '   ')).toBeNull();
  });

  it('refuses numbers the server would refuse', () => {
    for (const enteredNumber of ['two', '1e3', '2.', '1234567890123456', '0.1234567']) {
      expect(() => readCardValueInput(BoardPropertyKind.Number, enteredNumber)).toThrow(AppError);
    }
    expect(readCardValueInput(BoardPropertyKind.Number, '123456789012345.123456')).toEqual({
      number: '123456789012345.123456',
    });
  });
});
