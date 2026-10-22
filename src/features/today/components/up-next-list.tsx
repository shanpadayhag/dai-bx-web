import { Play } from 'lucide-react';
import CompletionCircle from '@/core/components/atoms/completion-circle';
import IconButton from '@/core/components/atoms/icon-button';
import UpNextTask from '@/features/today/entities/up-next-task';

type UpNextListProps = {
  upNextTasks: UpNextTask[];
};

const UpNextList = ({ upNextTasks }: UpNextListProps) => (
  <section className="grid gap-2 rounded-2xl border border-border bg-background p-3 shadow-soft">
    <h2 className="px-2 pt-1.5 text-[13px] font-semibold text-foreground">Up next</h2>
    <ul className="grid gap-0.5">
      {upNextTasks.map((upNextTask) => (
        <li
          key={upNextTask.id}
          className="group/row flex min-h-11 items-center gap-3 rounded-[10px] px-2 transition-colors duration-150 hover:bg-surface"
        >
          <CompletionCircle isDone={false} label={`Mark ${upNextTask.name} as done`} />
          <span className="grid min-w-0 flex-1">
            <span className="truncate text-sm text-foreground">{upNextTask.name}</span>
            <span className="text-xs text-muted-foreground">{upNextTask.groupName}</span>
          </span>
          {upNextTask.estimate ? (
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {upNextTask.estimate}
            </span>
          ) : null}
          <IconButton label={`Start ${upNextTask.name}`} tone="primary">
            <Play className="fill-current" />
          </IconButton>
        </li>
      ))}
    </ul>
  </section>
);

export default UpNextList;
