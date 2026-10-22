import type { ReactNode } from 'react';
import AppShell from '@/core/components/templates/app-shell';
import FinishTaskDialog from '@/features/tracking/components/finish-task-dialog';
import RunningTaskPill from '@/features/tracking/components/running-task-pill';
import sampleTaskSessionSource from '@/features/tracking/data_sources/sample/task-session-source';

const ProductLayout = ({ children }: { children: ReactNode }) => {
  const runningTaskSession = sampleTaskSessionSource.findRunning();

  return (
    <AppShell
      topbarEnd={<RunningTaskPill taskSession={runningTaskSession} />}
      overlays={<FinishTaskDialog taskSession={runningTaskSession} />}
    >
      {children}
    </AppShell>
  );
};

export default ProductLayout;
