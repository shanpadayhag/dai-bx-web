import type BoardRecord from '@/features/board/entities/board-record';
import type {
  BoardCardRecord,
  BoardListRecord,
  BoardPropertyRecord,
  PropertyOptionRecord,
} from '@/features/board/entities/board-record';
import type CardPropertyValue from '@/features/board/entities/card-property-value';

export type LocalBoardChange =
  | { kind: 'renameBoard'; boardName: string }
  | { kind: 'addList'; listRecord: BoardListRecord }
  | { kind: 'renameList'; listId: string; listName: string }
  | { kind: 'moveList'; listId: string; position: number }
  | { kind: 'deleteList'; listId: string }
  | { kind: 'addCard'; cardRecord: BoardCardRecord }
  | {
      kind: 'updateCard';
      cardId: string;
      title?: string;
      dueDate?: string | null;
      dueTime?: string | null;
    }
  | { kind: 'moveCard'; cardId: string; listId: string; position: number }
  | { kind: 'deleteCard'; cardId: string }
  | { kind: 'setValue'; cardId: string; cardValue: CardPropertyValue }
  | { kind: 'clearValue'; cardId: string; propertyId: string }
  | { kind: 'addProperty'; propertyRecord: BoardPropertyRecord }
  | { kind: 'renameProperty'; propertyId: string; propertyName: string }
  | { kind: 'moveProperty'; propertyId: string; position: number }
  | { kind: 'deleteProperty'; propertyId: string }
  | { kind: 'addOption'; propertyId: string; optionRecord: PropertyOptionRecord }
  | { kind: 'updateOption'; optionId: string; optionName?: string; color?: string | null }
  | { kind: 'moveOption'; optionId: string; position: number }
  | { kind: 'deleteOption'; optionId: string };

type Positioned = { id: string; position: number };

const sortByPosition = <Item extends Positioned>(items: readonly Item[]) =>
  [...items].sort((firstItem, secondItem) => firstItem.position - secondItem.position);

const renumber = <Item extends Positioned>(orderedItems: readonly Item[]) =>
  orderedItems.map((item, position) => (item.position === position ? item : { ...item, position }));

const insertAt = <Item extends Positioned>(
  items: readonly Item[],
  insertedItem: Item,
  requestedPosition: number,
) => {
  const orderedItems = sortByPosition(items.filter((item) => item.id !== insertedItem.id));
  orderedItems.splice(Math.min(requestedPosition, orderedItems.length), 0, insertedItem);
  return renumber(orderedItems);
};

const moveWithin = <Item extends Positioned>(
  items: readonly Item[],
  itemId: string,
  requestedPosition: number,
) => {
  const movingItem = items.find((item) => item.id === itemId);
  return movingItem === undefined ? [...items] : insertAt(items, movingItem, requestedPosition);
};

const removeWithin = <Item extends Positioned>(items: readonly Item[], itemId: string) =>
  renumber(sortByPosition(items.filter((item) => item.id !== itemId)));

const appendLast = <Item extends Positioned>(items: readonly Item[], addedItem: Item) =>
  insertAt(items, addedItem, items.length);

const cardsOfList = (cardRecords: readonly BoardCardRecord[], listId: string) =>
  cardRecords.filter((cardRecord) => cardRecord.listId === listId);

const replaceListCards = (
  cardRecords: readonly BoardCardRecord[],
  listId: string,
  listCards: readonly BoardCardRecord[],
) => [...cardRecords.filter((cardRecord) => cardRecord.listId !== listId), ...listCards];

const moveCard = (
  cardRecords: readonly BoardCardRecord[],
  cardId: string,
  listId: string,
  requestedPosition: number,
) => {
  const movingCard = cardRecords.find((cardRecord) => cardRecord.id === cardId);
  if (movingCard === undefined) return [...cardRecords];
  const withSourceClosed = replaceListCards(
    cardRecords,
    movingCard.listId,
    removeWithin(cardsOfList(cardRecords, movingCard.listId), cardId),
  );
  return replaceListCards(
    withSourceClosed,
    listId,
    insertAt(cardsOfList(withSourceClosed, listId), { ...movingCard, listId }, requestedPosition),
  );
};

const changeCards = (
  boardRecord: BoardRecord,
  changeCard: (cardRecord: BoardCardRecord) => BoardCardRecord,
): BoardRecord => ({ ...boardRecord, cards: boardRecord.cards.map(changeCard) });

const withoutValues = (
  boardRecord: BoardRecord,
  isRemovedValue: (cardValue: CardPropertyValue) => boolean,
) =>
  changeCards(boardRecord, (cardRecord) =>
    cardRecord.values.some(isRemovedValue)
      ? {
          ...cardRecord,
          values: cardRecord.values.filter((cardValue) => !isRemovedValue(cardValue)),
        }
      : cardRecord,
  );

const setCardValue = (
  boardRecord: BoardRecord,
  cardId: string,
  cardValue: CardPropertyValue,
): BoardRecord => {
  const propertyPositions = new Map(
    boardRecord.properties.map((propertyRecord) => [propertyRecord.id, propertyRecord.position]),
  );
  const propertyPosition = (value: CardPropertyValue) =>
    propertyPositions.get(value.propertyId) ?? Number.MAX_SAFE_INTEGER;
  return changeCards(boardRecord, (cardRecord) =>
    cardRecord.id === cardId
      ? {
          ...cardRecord,
          values: [
            ...cardRecord.values.filter((value) => value.propertyId !== cardValue.propertyId),
            cardValue,
          ].sort(
            (firstValue, secondValue) =>
              propertyPosition(firstValue) - propertyPosition(secondValue),
          ),
        }
      : cardRecord,
  );
};

const changeOptions = (
  boardRecord: BoardRecord,
  optionId: string,
  changeOptionList: (optionRecords: readonly PropertyOptionRecord[]) => PropertyOptionRecord[],
): BoardRecord => ({
  ...boardRecord,
  properties: boardRecord.properties.map((propertyRecord) =>
    propertyRecord.options.some((optionRecord) => optionRecord.id === optionId)
      ? { ...propertyRecord, options: changeOptionList(propertyRecord.options) }
      : propertyRecord,
  ),
});

const renamed = <Item extends { id: string; name: string }>(
  items: readonly Item[],
  itemId: string,
  itemName: string,
) => items.map((item) => (item.id === itemId ? { ...item, name: itemName } : item));

export const applyBoardChange = (
  boardRecord: BoardRecord,
  localChange: LocalBoardChange,
): BoardRecord => {
  switch (localChange.kind) {
    case 'renameBoard':
      return { ...boardRecord, board: { ...boardRecord.board, name: localChange.boardName } };
    case 'addList':
      return { ...boardRecord, lists: appendLast(boardRecord.lists, localChange.listRecord) };
    case 'renameList':
      return {
        ...boardRecord,
        lists: renamed(boardRecord.lists, localChange.listId, localChange.listName),
      };
    case 'moveList':
      return {
        ...boardRecord,
        lists: moveWithin(boardRecord.lists, localChange.listId, localChange.position),
      };
    case 'deleteList':
      return {
        ...boardRecord,
        lists: removeWithin(boardRecord.lists, localChange.listId),
        cards: boardRecord.cards.filter((cardRecord) => cardRecord.listId !== localChange.listId),
      };
    case 'addCard': {
      const listId = localChange.cardRecord.listId;
      return {
        ...boardRecord,
        cards: replaceListCards(
          boardRecord.cards,
          listId,
          appendLast(cardsOfList(boardRecord.cards, listId), localChange.cardRecord),
        ),
      };
    }
    case 'updateCard':
      return changeCards(boardRecord, (cardRecord) =>
        cardRecord.id === localChange.cardId
          ? {
              ...cardRecord,
              ...(localChange.title === undefined ? {} : { title: localChange.title }),
              ...(localChange.dueDate === undefined ? {} : { dueDate: localChange.dueDate }),
              ...(localChange.dueTime === undefined ? {} : { dueTime: localChange.dueTime }),
            }
          : cardRecord,
      );
    case 'moveCard': {
      const isListOnBoard = boardRecord.lists.some(
        (listRecord) => listRecord.id === localChange.listId,
      );
      return isListOnBoard
        ? {
            ...boardRecord,
            cards: moveCard(
              boardRecord.cards,
              localChange.cardId,
              localChange.listId,
              localChange.position,
            ),
          }
        : boardRecord;
    }
    case 'deleteCard': {
      const deletedCard = boardRecord.cards.find(
        (cardRecord) => cardRecord.id === localChange.cardId,
      );
      if (deletedCard === undefined) return boardRecord;
      return {
        ...boardRecord,
        cards: replaceListCards(
          boardRecord.cards,
          deletedCard.listId,
          removeWithin(cardsOfList(boardRecord.cards, deletedCard.listId), deletedCard.id),
        ),
      };
    }
    case 'setValue':
      return setCardValue(boardRecord, localChange.cardId, localChange.cardValue);
    case 'clearValue':
      return changeCards(boardRecord, (cardRecord) =>
        cardRecord.id === localChange.cardId
          ? {
              ...cardRecord,
              values: cardRecord.values.filter(
                (cardValue) => cardValue.propertyId !== localChange.propertyId,
              ),
            }
          : cardRecord,
      );
    case 'addProperty':
      return {
        ...boardRecord,
        properties: appendLast(boardRecord.properties, localChange.propertyRecord),
      };
    case 'renameProperty':
      return {
        ...boardRecord,
        properties: renamed(
          boardRecord.properties,
          localChange.propertyId,
          localChange.propertyName,
        ),
      };
    case 'moveProperty':
      return {
        ...boardRecord,
        properties: moveWithin(
          boardRecord.properties,
          localChange.propertyId,
          localChange.position,
        ),
      };
    case 'deleteProperty':
      return withoutValues(
        {
          ...boardRecord,
          properties: removeWithin(boardRecord.properties, localChange.propertyId),
        },
        (cardValue) => cardValue.propertyId === localChange.propertyId,
      );
    case 'addOption':
      return {
        ...boardRecord,
        properties: boardRecord.properties.map((propertyRecord) =>
          propertyRecord.id === localChange.propertyId
            ? {
                ...propertyRecord,
                options: appendLast(propertyRecord.options, localChange.optionRecord),
              }
            : propertyRecord,
        ),
      };
    case 'updateOption':
      return changeOptions(boardRecord, localChange.optionId, (optionRecords) =>
        optionRecords.map((optionRecord) =>
          optionRecord.id === localChange.optionId
            ? {
                ...optionRecord,
                ...(localChange.optionName === undefined ? {} : { name: localChange.optionName }),
                ...(localChange.color === undefined
                  ? {}
                  : { color: localChange.color?.toLowerCase() ?? null }),
              }
            : optionRecord,
        ),
      );
    case 'moveOption':
      return changeOptions(boardRecord, localChange.optionId, (optionRecords) =>
        moveWithin(optionRecords, localChange.optionId, localChange.position),
      );
    case 'deleteOption':
      return withoutValues(
        changeOptions(boardRecord, localChange.optionId, (optionRecords) =>
          removeWithin(optionRecords, localChange.optionId),
        ),
        (cardValue) => 'optionId' in cardValue && cardValue.optionId === localChange.optionId,
      );
  }
};
