'use client';

import { Bell, Settings } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import hidePopover from '@/core/popover';
import ThisDeviceBadge from '@/features/notifications/components/this-device-badge';
import thisDeviceStatus, {
  type ThisDeviceStatus,
} from '@/features/notifications/entities/this-device-status';
import useNotificationBellEvents from '@/features/notifications/events/use-notification-bell-events';

export const NOTIFICATION_BELL_PANEL_ID = 'notification-bell-panel';
const NOTIFICATION_SETTINGS_PATH = '/settings#notifications';

const bellDescriptions: Record<ThisDeviceStatus, string> = {
  on: 'Check-ins and reminders reach this device.',
  off: 'Get check-ins and reminders here, even with DaiBX closed.',
  blocked: 'Your browser blocks DaiBX. Allow notifications in this site’s settings.',
  'needs-home-screen': 'Add DaiBX to your Home Screen first. Settings shows how.',
  unsupported: 'This browser can’t show DaiBX notifications.',
};

const NotificationBell = () => {
  const { thisDeviceFacts, isTurningOn, handleRefresh, handleTurnOn } = useNotificationBellEvents();
  const status = thisDeviceFacts === null ? null : thisDeviceStatus(thisDeviceFacts);

  return (
    <>
      <IconButton label="Notifications" popoverTarget={NOTIFICATION_BELL_PANEL_ID}>
        <Bell />
      </IconButton>
      <div
        id={NOTIFICATION_BELL_PANEL_ID}
        popover="auto"
        role="dialog"
        aria-label="Notifications"
        onToggle={(toggleEvent) => {
          if (toggleEvent.newState === 'open') handleRefresh();
        }}
        className="m-auto w-[min(320px,calc(100vw-2rem))] rounded-xl border border-border bg-background p-0 text-foreground shadow-lift backdrop:bg-transparent supports-[position-area:bottom]:m-0 supports-[position-area:bottom]:mt-1.5 supports-[position-area:bottom]:[position-area:bottom_span-left] supports-[position-area:bottom]:[position-try-fallbacks:flip-block]"
      >
        <div className="grid gap-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            {status === null ? null : <ThisDeviceBadge status={status} />}
          </div>
          <p className="text-[13px] text-muted-foreground">
            {status === null ? 'Checking this device…' : bellDescriptions[status]}
          </p>
          <div
            className="flex flex-wrap gap-2"
            onClick={(clickEvent) => {
              if (clickEvent.target instanceof Element && clickEvent.target.closest('a') !== null) {
                hidePopover(NOTIFICATION_BELL_PANEL_ID);
              }
            }}
          >
            {status === 'off' ? (
              <Button size="sm" disabled={isTurningOn} onClick={() => void handleTurnOn()}>
                {isTurningOn ? 'Turning on…' : 'Turn on'}
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" href={NOTIFICATION_SETTINGS_PATH}>
              <Settings />
              Notification settings
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationBell;
