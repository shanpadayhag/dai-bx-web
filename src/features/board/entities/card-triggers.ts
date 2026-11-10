type CardTriggerKind = 'started' | 'finished';

type CardTriggerTarget = {
  listId: string | null;
  listName: string | null;
};

type CardTriggers = Record<CardTriggerKind, CardTriggerTarget | null>;

const isTriggerFlagged = (triggerTarget: CardTriggerTarget | null): boolean =>
  triggerTarget !== null && triggerTarget.listId === null;

export type { CardTriggerKind, CardTriggerTarget };
export { isTriggerFlagged };
export default CardTriggers;
