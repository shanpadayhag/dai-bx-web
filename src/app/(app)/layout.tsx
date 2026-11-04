import type { ReactNode } from 'react';
import AppShell from '@/core/components/templates/app-shell';
import SessionGate from '@/features/auth/components/session-gate';
import SidebarAccount from '@/features/auth/components/sidebar-account';
import CheckInCard from '@/features/tracking/components/check-in-card';
import FinishTaskDialog from '@/features/tracking/components/finish-task-dialog';
import RunningList from '@/features/tracking/components/running-list';
import RunningPill from '@/features/tracking/components/running-pill';
import sampleRunningItemSource from '@/features/tracking/data_sources/sample/running-item-source';
import { checkInSinceMoment } from '@/features/tracking/entities/running-item';

const ProductLayout = ({ children }: { children: ReactNode }) => {
  const now = sampleRunningItemSource.findNow();
  const runningItems = sampleRunningItemSource.findRunning();
  const finishingItem = runningItems.find((runningItem) => runningItem.sourceKind === 'task');

  return (
    <SessionGate>
      <AppShell
        sidebarAccount={<SidebarAccount />}
        topbarEnd={<RunningPill runningItems={runningItems} now={now} />}
        overlays={
          <>
            <RunningList runningItems={runningItems} now={now} />
            <CheckInCard dueItems={runningItems} />
            {finishingItem === undefined ? null : (
              <FinishTaskDialog
                runningItem={finishingItem}
                now={now}
                missedCheckInSince={checkInSinceMoment(finishingItem)}
              />
            )}
          </>
        }
      >
        {children}
      </AppShell>
    </SessionGate>
  );
};

export default ProductLayout;
