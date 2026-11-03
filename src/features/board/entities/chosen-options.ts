import type BoardProperty from '@/features/board/entities/board-property';
import type CardPropertyValue from '@/features/board/entities/card-property-value';
import type PropertyOption from '@/features/board/entities/property-option';

export type ChosenOption = {
  propertyName: string;
  option: PropertyOption;
};

export const findChosenOptions = (
  properties: readonly BoardProperty[],
  values: readonly CardPropertyValue[],
): ChosenOption[] => {
  const chosenOptionIdsByPropertyId = new Map(
    values.flatMap((value) => ('optionId' in value ? [[value.propertyId, value.optionId]] : [])),
  );
  return properties.flatMap((property) => {
    const chosenOptionId = chosenOptionIdsByPropertyId.get(property.id);
    const chosenOption = property.options.find((option) => option.id === chosenOptionId);
    return chosenOption === undefined
      ? []
      : [{ propertyName: property.name, option: chosenOption }];
  });
};
