import { describe, expect, it } from 'vitest';
import type { BoardCardRecord } from '@/features/board/entities/board-record';
import type CardPropertyValue from '@/features/board/entities/card-property-value';
import {
  countCardsUsingOption,
  countCardsUsingProperty,
} from '@/features/board/entities/property-use';

const cardWithValues = (cardId: string, values: CardPropertyValue[]): BoardCardRecord => ({
  id: cardId,
  listId: 'list-backlog',
  position: 0,
  title: cardId,
  dueDate: null,
  dueTime: null,
  values,
  linkedTaskCount: 0,
  doneLinkedTaskCount: 0,
  nextMove: null,
});

const cardRecords = [
  cardWithValues('card-plan', [
    { propertyId: 'property-project', optionId: 'option-daibx' },
    { propertyId: 'property-hours', number: '2.50' },
  ]),
  cardWithValues('card-pay', [{ propertyId: 'property-project', optionId: 'option-home' }]),
  cardWithValues('card-read', []),
];

describe('property use', () => {
  it('counts the cards with any value for a property', () => {
    expect(countCardsUsingProperty(cardRecords, 'property-project')).toBe(2);
    expect(countCardsUsingProperty(cardRecords, 'property-hours')).toBe(1);
    expect(countCardsUsingProperty(cardRecords, 'property-size')).toBe(0);
  });

  it('counts only the cards that chose an option', () => {
    expect(countCardsUsingOption(cardRecords, 'option-daibx')).toBe(1);
    expect(countCardsUsingOption(cardRecords, 'option-work')).toBe(0);
  });
});
