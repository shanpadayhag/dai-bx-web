import type { ReactNode } from 'react';
import AppShell from '@/core/components/templates/app-shell';
import SessionGate from '@/features/auth/components/session-gate';
import SidebarAccount from '@/features/auth/components/sidebar-account';
import DeviceRegistration from '@/features/notifications/components/device-registration';
import NotificationBell from '@/features/notifications/components/notification-bell';
import TrackingPill from '@/features/tracking/components/tracking-pill';
import TrackingProvider from '@/features/tracking/components/tracking-provider';

const ProductLayout = ({ children }: { children: ReactNode }) => (
  <SessionGate>
    <TrackingProvider>
      <DeviceRegistration />
      <AppShell
        sidebarAccount={<SidebarAccount />}
        topbarEnd={
          <>
            <TrackingPill />
            <NotificationBell />
          </>
        }
      >
        {children}
      </AppShell>
    </TrackingProvider>
  </SessionGate>
);

export default ProductLayout;
