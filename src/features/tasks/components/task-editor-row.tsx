import { CornerDownLeft } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';

type TaskEditorRowProps = {
  defaultName?: string;
  placeholder: string;
  submitLabel: string;
};

const TaskEditorRow = ({ defaultName, placeholder, submitLabel }: TaskEditorRowProps) => (
  <form className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-background p-1.5 pl-8 shadow-soft ring-4 ring-primary/10">
    <Input
      defaultValue={defaultName}
      placeholder={placeholder}
      aria-label={placeholder}
      isFullWidth={false}
      className="h-8 min-w-[12rem] flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
    />
    <Input
      isFullWidth={false}
      placeholder="Estimate"
      aria-label="Estimate"
      className="h-8 w-24 font-mono text-[13px]"
    />
    <Button variant="ghost" size="sm">
      Cancel
    </Button>
    <Button type="submit" size="sm">
      {submitLabel}
      <CornerDownLeft />
    </Button>
  </form>
);

export default TaskEditorRow;
