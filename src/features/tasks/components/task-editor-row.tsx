import { CornerDownLeft } from 'lucide-react';
import type { FormEvent } from 'react';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';

type TaskEditorRowProps = {
  defaultName?: string;
  defaultEstimate?: string;
  isEstimateShown: boolean;
  placeholder: string;
  submitLabel: string;
  onSubmitTask: (enteredName: string, estimateText: string) => void;
  onCancel: () => void;
};

const readEditorField = (editorForm: HTMLFormElement, fieldName: string) => {
  const fieldValue = new FormData(editorForm).get(fieldName);
  return typeof fieldValue === 'string' ? fieldValue : '';
};

const TaskEditorRow = ({
  defaultName,
  defaultEstimate,
  isEstimateShown,
  placeholder,
  submitLabel,
  onSubmitTask,
  onCancel,
}: TaskEditorRowProps) => {
  const handleSubmit = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const editorForm = submitEvent.currentTarget;
    onSubmitTask(readEditorField(editorForm, 'taskName'), readEditorField(editorForm, 'estimate'));
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === 'Escape') onCancel();
      }}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-background p-1.5 pl-8 shadow-soft ring-4 ring-primary/10"
    >
      <Input
        name="taskName"
        defaultValue={defaultName}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={500}
        autoFocus
        isFullWidth={false}
        className="h-8 min-w-[12rem] flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
      />
      {isEstimateShown ? (
        <Input
          name="estimate"
          defaultValue={defaultEstimate}
          isFullWidth={false}
          placeholder="Estimate"
          aria-label="Estimate"
          className="h-8 w-24 font-mono text-[13px]"
        />
      ) : null}
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" size="sm">
        {submitLabel}
        <CornerDownLeft />
      </Button>
    </form>
  );
};

export default TaskEditorRow;
