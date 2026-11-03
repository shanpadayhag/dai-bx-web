const countNoun = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

export const describeBoardDeletion = (listCount: number, cardCount: number): string => {
  if (listCount === 0) return 'It has no lists.';
  return `Its ${countNoun(listCount, 'list', 'lists')} and ${countNoun(cardCount, 'card', 'cards')} are deleted with it, along with its properties.`;
};

export const describeListDeletion = (cardCount: number): string => {
  if (cardCount === 0) return 'It has no cards.';
  if (cardCount === 1) return 'Its 1 card is deleted with it.';
  return `All ${cardCount} of its cards are deleted with it.`;
};

export const describeCardDeletion = (linkedTaskCount: number): string => {
  if (linkedTaskCount === 0) return 'Its notes and properties go with it.';
  return `Its notes and properties go with it. Its ${countNoun(linkedTaskCount, 'task stays', 'tasks stay')} on the Tasks page without the link.`;
};

export const describePropertyUseDeletion = (usingCardCount: number): string => {
  if (usingCardCount === 0) return 'No card uses it.';
  return `It’s cleared from the ${countNoun(usingCardCount, 'card', 'cards')} that use it.`;
};
