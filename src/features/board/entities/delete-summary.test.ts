import { expect, test } from 'vitest';
import {
  describeBoardDeletion,
  describeCardDeletion,
  describeListDeletion,
  describePropertyUseDeletion,
} from '@/features/board/entities/delete-summary';

test('a board deletion names its lists and cards', () => {
  expect(describeBoardDeletion(1, 1)).toBe(
    'Its 1 list and 1 card are deleted with it, along with its properties.',
  );
  expect(describeBoardDeletion(5, 8)).toBe(
    'Its 5 lists and 8 cards are deleted with it, along with its properties.',
  );
  expect(describeBoardDeletion(0, 0)).toBe('It has no lists.');
});

test('a list deletion names its cards', () => {
  expect(describeListDeletion(0)).toBe('It has no cards.');
  expect(describeListDeletion(1)).toBe('Its 1 card is deleted with it.');
  expect(describeListDeletion(4)).toBe('All 4 of its cards are deleted with it.');
});

test('a card deletion says its tasks stay', () => {
  expect(describeCardDeletion(0)).toBe('Its notes and properties go with it.');
  expect(describeCardDeletion(1)).toBe(
    'Its notes and properties go with it. Its 1 task stays on the Tasks page without the link.',
  );
  expect(describeCardDeletion(5)).toBe(
    'Its notes and properties go with it. Its 5 tasks stay on the Tasks page without the link.',
  );
});

test('a property or option deletion names the cards it clears', () => {
  expect(describePropertyUseDeletion(0)).toBe('No card uses it.');
  expect(describePropertyUseDeletion(7)).toBe('It’s cleared from the 7 cards that use it.');
});
