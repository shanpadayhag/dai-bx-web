import { expect, test } from 'vitest';
import { findChosenOptions } from '@/features/board/entities/chosen-options';
import BoardPropertyKind from '@/features/board/enums/board-property-kind';

const properties = [
  {
    id: 'size',
    name: 'Size',
    kind: BoardPropertyKind.Choice,
    options: [{ id: 'size-s', name: 'S', color: null }],
  },
  { id: 'hours', name: 'Hours', kind: BoardPropertyKind.Number, options: [] },
  {
    id: 'project',
    name: 'Project',
    kind: BoardPropertyKind.Choice,
    options: [{ id: 'chinese', name: 'Chinese', color: '#be7e86' }],
  },
];

test('chosen options follow the board’s property order, not the card’s value order', () => {
  const chosenOptions = findChosenOptions(properties, [
    { propertyId: 'project', optionId: 'chinese' },
    { propertyId: 'hours', number: '2' },
    { propertyId: 'size', optionId: 'size-s' },
  ]);

  expect(chosenOptions.map((chosenOption) => chosenOption.option.name)).toEqual(['S', 'Chinese']);
});

test('text and number values never become chips', () => {
  expect(findChosenOptions(properties, [{ propertyId: 'hours', number: '2' }])).toEqual([]);
});
