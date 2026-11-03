const BoardPropertyKind = {
  Choice: 'choice',
  Text: 'text',
  Number: 'number',
} as const;

type BoardPropertyKind = (typeof BoardPropertyKind)[keyof typeof BoardPropertyKind];

export const boardPropertyKindLabels: Record<BoardPropertyKind, string> = {
  choice: 'Choice',
  text: 'Text',
  number: 'Number',
};

export default BoardPropertyKind;
