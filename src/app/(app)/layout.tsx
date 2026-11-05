import type { ReactNode } from 'react';
import AppShell from '@/core/components/templates/app-shell';
import SessionGate from '@/features/auth/components/session-gate';
import SidebarAccount from '@/features/auth/components/sidebar-account';
import TrackingPill from '@/features/tracking/components/tracking-pill';
import TrackingProvider from '@/features/tracking/components/tracking-provider';

const ProductLayout = ({ children }: { children: ReactNode }) => (
  <SessionGate>
    <TrackingProvider>
      <AppShell sidebarAccount={<SidebarAccount />} topbarEnd={<TrackingPill />}>
        {children}
      </AppShell>
    </TrackingProvider>
  </SessionGate>
);

export default ProductLayout;
