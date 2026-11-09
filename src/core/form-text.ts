import type { RepeatRule } from '@/core/repeat-rule';

const readFormText = (submittedForm: FormData, fieldName: string) => {
  const fieldValue = submittedForm.get(fieldName);
  return typeof fieldValue === 'string' ? fieldValue : '';
};

const readFormRepeatRule = (submittedForm: FormData, fieldName: string): RepeatRule | null => {
  const ruleText = readFormText(submittedForm, fieldName);
  return ruleText === '' ? null : (JSON.parse(ruleText) as RepeatRule);
};

const readFormCategoryId = (submittedForm: FormData, fieldName: string): string | null => {
  const categoryId = readFormText(submittedForm, fieldName);
  return categoryId === '' ? null : categoryId;
};

export { readFormCategoryId, readFormRepeatRule };
export default readFormText;
