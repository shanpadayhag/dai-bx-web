const readFormText = (submittedForm: FormData, fieldName: string) => {
  const fieldValue = submittedForm.get(fieldName);
  return typeof fieldValue === 'string' ? fieldValue : '';
};

export default readFormText;
