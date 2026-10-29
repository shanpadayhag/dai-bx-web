import { CircleAlert, FileJson, ListTree, Upload } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import type { FormEvent } from 'react';
import type GroupImportPreview from '@/features/tasks/entities/group-import-preview';
import { type GroupImportReading } from '@/features/tasks/entities/group-import-preview';
import type GroupImportProblem from '@/features/tasks/entities/group-import-problem';

type ImportGroupDialogProps = {
  id: string;
  groupImportReading: GroupImportReading | null;
  isSubmitting: boolean;
  onChooseFile: (chosenFile: File | null) => void;
  onSubmit: (submitEvent: FormEvent<HTMLFormElement>) => void;
};

const SHOWN_TASK_NAME_COUNT = 3;

type FilePickerProps = {
  inputId: string;
  chosenFileName?: string;
  onChooseFile: (chosenFile: File | null) => void;
};

const FilePicker = ({ inputId, chosenFileName, onChooseFile }: FilePickerProps) => (
  <label
    htmlFor={inputId}
    className="group/picker grid cursor-pointer justify-items-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface px-4 py-5 text-center transition-colors duration-150 hover:border-primary/50 hover:bg-primary-soft/40 has-focus-visible:border-primary has-focus-visible:ring-4 has-focus-visible:ring-primary/15"
  >
    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-soft group-hover/picker:text-primary">
      <FileJson className="size-4.5" />
    </span>
    <span className="grid gap-0.5">
      <span className="text-sm font-medium text-foreground">
        {chosenFileName ?? 'Choose a .json file'}
      </span>
      <span className="text-xs text-muted-foreground">
        {chosenFileName ? 'Choose a different file' : 'or drop it here · up to 1 MB'}
      </span>
    </span>
    <input
      id={inputId}
      type="file"
      accept=".json,application/json"
      className="sr-only"
      onChange={(changeEvent) => {
        onChooseFile(changeEvent.currentTarget.files?.[0] ?? null);
        changeEvent.currentTarget.value = '';
      }}
    />
  </label>
);

const PreviewSummary = ({ importPreview }: { importPreview: GroupImportPreview }) => {
  const hiddenTaskNameCount = importPreview.topLevelTaskNames.length - SHOWN_TASK_NAME_COUNT;
  return (
    <div className="grid gap-3 rounded-xl border border-border p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
          <ListTree className="size-4" />
        </span>
        <div className="grid min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            New group “{importPreview.groupName === '' ? 'unnamed' : importPreview.groupName}”
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {importPreview.taskCount} tasks · {importPreview.deepestLevel} levels deep · no category
          </p>
        </div>
      </div>
      <ul className="grid gap-1 border-t border-border pt-3 text-[13px] text-muted-foreground">
        {importPreview.topLevelTaskNames.slice(0, SHOWN_TASK_NAME_COUNT).map((taskName) => (
          <li key={taskName} className="flex items-center gap-2">
            <span className="size-3.5 shrink-0 rounded-full border border-border-strong" />
            <span className="truncate">{taskName}</span>
          </li>
        ))}
        {hiddenTaskNameCount > 0 ? (
          <li className="pl-5.5 text-xs">and {hiddenTaskNameCount} more at the top level</li>
        ) : null}
      </ul>
    </div>
  );
};

const ProblemNotice = ({ importProblem }: { importProblem: GroupImportProblem }) => (
  <div
    role="alert"
    className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 rounded-xl bg-danger-soft p-3.5"
  >
    <CircleAlert className="mt-0.5 size-4 text-danger" />
    <p className="text-sm font-medium text-foreground">{importProblem.message}</p>
    <p className="col-start-2 text-[13px] text-muted-foreground">
      {importProblem.path === '' ? null : (
        <>
          Found at{' '}
          <code className="rounded bg-background/70 px-1 py-0.5 font-mono text-xs text-foreground">
            {importProblem.path}
          </code>
          .{' '}
        </>
      )}
      Nothing was imported; fix the file and choose it again.
    </p>
  </div>
);

const ImportGroupDialog = ({
  id,
  groupImportReading,
  isSubmitting,
  onChooseFile,
  onSubmit,
}: ImportGroupDialogProps) => {
  const importPreview = groupImportReading?.kind === 'ready' ? groupImportReading.preview : null;
  const importProblem = groupImportReading?.kind === 'problem' ? groupImportReading.problem : null;

  return (
    <PopoverPanel id={id} label="Import a group">
      <form className="grid gap-5 p-5 sm:p-6" onSubmit={onSubmit}>
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
            <Upload className="size-5" />
          </span>
          <div className="grid gap-1">
            <h2 className="text-base font-semibold text-foreground">Import a group</h2>
            <p className="text-sm text-muted-foreground">
              Pick a group file from your daily plan. It arrives as a new group, and nothing you
              already have is replaced.
            </p>
          </div>
        </div>
        <FilePicker
          inputId={`${id}-file`}
          chosenFileName={importPreview?.fileName ?? importProblem?.fileName}
          onChooseFile={onChooseFile}
        />
        {importPreview === null ? null : <PreviewSummary importPreview={importPreview} />}
        {importProblem === null ? null : <ProblemNotice importProblem={importProblem} />}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" popoverTarget={id} popoverTargetAction="hide">
            Cancel
          </Button>
          <Button type="submit" disabled={importPreview === null || isSubmitting}>
            Import group
          </Button>
        </div>
      </form>
    </PopoverPanel>
  );
};

export default ImportGroupDialog;
