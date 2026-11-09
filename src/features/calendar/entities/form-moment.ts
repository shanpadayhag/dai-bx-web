import readFormText from '@/core/form-text';
import { instantInZone } from '@/core/zoned-time';

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})/;

const readFormMoment = (submittedForm: FormData, fieldPrefix: string, timeZone: string): Date => {
  const dayMatch = DAY_PATTERN.exec(readFormText(submittedForm, `${fieldPrefix}-day`));
  const timeMatch = TIME_PATTERN.exec(readFormText(submittedForm, `${fieldPrefix}-time`));
  if (dayMatch === null || timeMatch === null) return new Date(Number.NaN);
  const [hour = 0, minute = 0] = timeMatch.slice(1).map(Number);
  return instantInZone(dayMatch[0], hour * 60 + minute, timeZone);
};

export { readFormMoment };
