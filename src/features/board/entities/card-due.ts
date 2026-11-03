export type CardDue = {
  dueDate: string;
  dueTime: string | null;
};

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const readLocalDate = (dueDate: string): Date => {
  const [yearText = '', monthText = '', dayText = ''] = dueDate.split('-');
  return new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
};

const readLocalDueMoment = (cardDue: CardDue): Date => {
  const dueDay = readLocalDate(cardDue.dueDate);
  if (cardDue.dueTime === null) {
    return new Date(dueDay.getFullYear(), dueDay.getMonth(), dueDay.getDate() + 1);
  }
  const [hourText = '0', minuteText = '0'] = cardDue.dueTime.split(':');
  dueDay.setHours(Number(hourText), Number(minuteText));
  return dueDay;
};

const countCalendarDaysBetween = (fromDay: Date, toDay: Date): number => {
  const fromMidnight = Date.UTC(fromDay.getFullYear(), fromDay.getMonth(), fromDay.getDate());
  const toMidnight = Date.UTC(toDay.getFullYear(), toDay.getMonth(), toDay.getDate());
  return Math.round((toMidnight - fromMidnight) / MILLISECONDS_PER_DAY);
};

const relativeDayNames = new Map([
  [-1, 'Yesterday'],
  [0, 'Today'],
  [1, 'Tomorrow'],
]);

const formatDueDay = (dueDay: Date, now: Date): string => {
  const relativeDayName = relativeDayNames.get(countCalendarDaysBetween(now, dueDay));
  if (relativeDayName !== undefined) return relativeDayName;
  return dueDay.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(dueDay.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
};

export const isCardDueOverdue = (cardDue: CardDue, now: Date): boolean =>
  now.getTime() >= readLocalDueMoment(cardDue).getTime();

export const formatCardDue = (cardDue: CardDue, now: Date): string => {
  const dueDayText = formatDueDay(readLocalDate(cardDue.dueDate), now);
  return cardDue.dueTime === null ? dueDayText : `${dueDayText}, ${cardDue.dueTime}`;
};
