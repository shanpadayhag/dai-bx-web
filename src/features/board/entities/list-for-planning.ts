import type ListExport from '@/features/board/entities/list-export';
import type { ExportedCard } from '@/features/board/entities/list-export';

const formatCardForPlanning = (exportedCard: ExportedCard) => {
  const cardLines = ['---', `# ${exportedCard.title}`, `- Card: ${exportedCard.id}`];
  if (exportedCard.dueDate !== null) {
    cardLines.push(
      exportedCard.dueTime === null
        ? `- Due: ${exportedCard.dueDate}`
        : `- Due: ${exportedCard.dueDate} ${exportedCard.dueTime}`,
    );
  }
  for (const exportedValue of exportedCard.values) {
    cardLines.push(`- ${exportedValue.property}: ${exportedValue.value}`);
  }
  const cardNotes = exportedCard.notes.trimEnd();
  if (cardNotes !== '') cardLines.push(cardNotes);
  return cardLines.join('\n');
};

export const formatListForPlanning = (listExport: ListExport) =>
  `${[
    `List: ${listExport.list.name} · Board: ${listExport.board.name}`,
    ...listExport.cards.map(formatCardForPlanning),
  ].join('\n\n')}\n`;
