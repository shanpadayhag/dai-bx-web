import readFormText from '@/core/form-text';

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})/;

const readFormMoment = (submittedForm: FormData, fieldPrefix: string): Date => {
  const dayMatch = DAY_PATTERN.exec(readFormText(submittedForm, `${fieldPrefix}-day`));
  const timeMatch = TIME_PATTERN.exec(readFormText(submittedForm, `${fieldPrefix}-time`));
  if (dayMatch === null || timeMatch === null) return new Date(Number.NaN);
  const [year, month, day] = dayMatch.slice(1).map(Number);
  const [hour, minute] = timeMatch.slice(1).map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined
  ) {
    return new Date(Number.NaN);
  }
  return new Date(year, month - 1, day, hour, minute);
};

const readFormCategoryId = (submittedForm: FormData, fieldName: string): string | null => {
  const categoryId = readFormText(submittedForm, fieldName);
  return categoryId === '' ? null : categoryId;
};

export { readFormCategoryId, readFormMoment };
