import { useState } from 'react';
import Input from '@/core/components/atoms/input';
import type BoardList from '@/features/board/entities/board-list';

type ArchiveAfterSaving = { hint: string | null };

type BoardColumnsSettingsProps = {
  headingId: string;
  lists: readonly BoardList[];
  onSaveArchiveAfter: (listId: string, enteredText: string) => Promise<ArchiveAfterSaving>;
};

type ColumnArchiveRowProps = {
  boardList: BoardList;
  archiveAfter: string;
  onSaveArchiveAfter: BoardColumnsSettingsProps['onSaveArchiveAfter'];
};

const ColumnArchiveRow = ({
  boardList,
  archiveAfter,
  onSaveArchiveAfter,
}: ColumnArchiveRowProps) => {
  const [refusedHint, setRefusedHint] = useState<string | null>(null);
  const [resetCount, setResetCount] = useState(0);
  const inputId = `archive-after-${boardList.id}`;
  const hintId = `${inputId}-hint`;

  const saveEnteredText = async (enteredText: string) => {
    if (enteredText.trim() === archiveAfter) return;
    const archiveAfterSaving = await onSaveArchiveAfter(boardList.id, enteredText);
    setRefusedHint(archiveAfterSaving.hint);
    setResetCount((currentResetCount) => currentResetCount + 1);
  };

  return (
    <li className="grid gap-1.5 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <label htmlFor={inputId} className="min-w-0 flex-1 truncate text-sm text-foreground">
          <span className="font-medium">{boardList.name}</span>
          <span className="sr-only">, archive cards left here after</span>
        </label>
        <span aria-hidden="true" className="text-xs text-muted-foreground">
          Archive after
        </span>
        <Input
          key={`${archiveAfter}-${resetCount}`}
          id={inputId}
          defaultValue={archiveAfter}
          placeholder="Never"
          maxLength={20}
          autoComplete="off"
          spellCheck={false}
          isFullWidth={false}
          aria-invalid={refusedHint !== null}
          aria-describedby={refusedHint === null ? undefined : hintId}
          onKeyDown={(keyEvent) => {
            if (keyEvent.key !== 'Enter') return;
            keyEvent.preventDefault();
            keyEvent.currentTarget.blur();
          }}
          onBlur={(blurEvent) => void saveEnteredText(blurEvent.currentTarget.value)}
          className="h-9 w-28 text-right tabular-nums aria-invalid:border-danger"
        />
      </div>
      {refusedHint === null ? null : (
        <p id={hintId} role="alert" className="text-right text-xs font-medium text-danger">
          {refusedHint}
        </p>
      )}
    </li>
  );
};

const BoardColumnsSettings = ({
  headingId,
  lists,
  onSaveArchiveAfter,
}: BoardColumnsSettingsProps) => (
  <section className="grid gap-3" aria-labelledby={headingId}>
    <div className="grid gap-0.5">
      <h3 id={headingId} className="text-[13px] font-medium text-foreground">
        Columns
      </h3>
      <p className="text-xs text-muted-foreground">
        Archive cards left in a column this long, like 3d, 2w or 1m. Leave it empty to keep them.
      </p>
    </div>
    {lists.length === 0 ? (
      <p className="rounded-xl border border-dashed border-border-strong px-4 py-5 text-center text-[13px] text-muted-foreground">
        No columns yet.
      </p>
    ) : (
      <ul className="grid divide-y divide-border rounded-xl border border-border">
        {lists.map((boardList) => (
          <ColumnArchiveRow
            key={boardList.id}
            boardList={boardList}
            archiveAfter={boardList.archiveAfter ?? ''}
            onSaveArchiveAfter={onSaveArchiveAfter}
          />
        ))}
      </ul>
    )}
  </section>
);

export type { ArchiveAfterSaving };
export default BoardColumnsSettings;
