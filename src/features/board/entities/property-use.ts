import type { BoardCardRecord } from '@/features/board/entities/board-record';

export const countCardsUsingProperty = (
  cardRecords: readonly BoardCardRecord[],
  propertyId: string,
): number =>
  cardRecords.filter((cardRecord) =>
    cardRecord.values.some((cardValue) => cardValue.propertyId === propertyId),
  ).length;

export const countCardsUsingOption = (
  cardRecords: readonly BoardCardRecord[],
  optionId: string,
): number =>
  cardRecords.filter((cardRecord) =>
    cardRecord.values.some(
      (cardValue) => 'optionId' in cardValue && cardValue.optionId === optionId,
    ),
  ).length;
