'use client';

import { Lock, RotateCw } from 'lucide-react';
import { useEffect } from 'react';
import Badge from '@/core/components/atoms/badge';
import Button from '@/core/components/atoms/button';
import Switch from '@/core/components/atoms/switch';
import HomeScreenSteps from '@/features/notifications/components/home-screen-steps';
import RemoveDeviceDialog from '@/features/notifications/components/remove-device-dialog';
import ThisDeviceBadge from '@/features/notifications/components/this-device-badge';
import describeDeviceReach from '@/features/notifications/entities/device-reach';
import type { NotificationSwitches } from '@/features/notifications/entities/notification-settings';
import thisDeviceStatus, {
  type ThisDeviceStatus,
} from '@/features/notifications/entities/this-device-status';
import useNotificationEvents from '@/features/notifications/events/use-notification-events';
import useNotificationStates from '@/features/notifications/states/use-notification-states';
import SettingRow from '@/features/settings/components/setting-row';
import SettingsSection from '@/features/settings/components/settings-section';

export const NOTIFICATIONS_SECTION_ID = 'notifications';

type NotificationsSectionProps = {
  workingHoursStart: string;
  workingHoursEnd: string;
  workingHoursSectionId: string;
};

const statusDescriptions: Record<ThisDeviceStatus, string> = {
  on: 'Check-ins and reminders reach this device, even with DaiBX closed.',
  off: 'Turn on to get check-ins and reminders here, even with DaiBX closed.',
  blocked:
    'Your browser blocks notifications from DaiBX. Allow them in this site’s settings, then reload the page.',
  'needs-home-screen': 'On iPhone and iPad, notifications need DaiBX on your Home Screen first.',
  unsupported: 'This browser can’t show DaiBX notifications. Try Chrome, Edge, Firefox or Safari.',
};

const kindSwitches: readonly {
  switchName: Exclude<keyof NotificationSwitches, 'quietOutsideWorkingHours'>;
  title: string;
  description: string;
}[] = [
  {
    switchName: 'checkIns',
    title: 'Check-ins',
    description:
      'When a running item reaches its check-in. Follows the check-in setting in Time tracking.',
  },
  {
    switchName: 'scheduleRuns',
    title: 'Schedule runs',
    description: 'When a card schedule moves a card.',
  },
  {
    switchName: 'blocksStarting',
    title: 'Blocks starting',
    description: 'When a planned block on your calendar starts.',
  },
];

const NotificationsSection = ({
  workingHoursStart,
  workingHoursEnd,
  workingHoursSectionId,
}: NotificationsSectionProps) => {
  const states = useNotificationStates();
  const events = useNotificationEvents(states);
  const { handleLoad } = events;
  const { notificationSettings, thisDeviceFacts, busyAction } = states;

  useEffect(() => {
    void handleLoad();
  }, [handleLoad]);

  const sectionDescription =
    'Reach you when DaiBX isn’t open: check-ins, schedule runs and blocks starting.';

  if (notificationSettings === null || thisDeviceFacts === null) {
    return (
      <SettingsSection
        id={NOTIFICATIONS_SECTION_ID}
        title="Notifications"
        description={sectionDescription}
      >
        {states.loadError === null ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading notifications…
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{states.loadError.description}</p>
            <Button variant="secondary" size="sm" onClick={() => void handleLoad()}>
              <RotateCw />
              Try again
            </Button>
          </div>
        )}
      </SettingsSection>
    );
  }

  const listedDeviceIds = notificationSettings.devices.map((pushDevice) => pushDevice.id);
  const status = thisDeviceStatus(thisDeviceFacts, listedDeviceIds);
  const thisDeviceId = thisDeviceFacts.thisDeviceId;
  const currentTime = new Date();
  const removeTargetName =
    notificationSettings.devices.find((pushDevice) => pushDevice.id === states.removeTargetDeviceId)
      ?.deviceName ?? null;

  const thisDeviceControl =
    status === 'on' && thisDeviceId !== null ? (
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={busyAction !== null}
          onClick={() => events.handleSendTest(thisDeviceId)}
        >
          Send a test
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={busyAction !== null}
          onClick={events.handleTurnOff}
        >
          Turn off
        </Button>
      </div>
    ) : status === 'off' ? (
      <Button size="sm" disabled={busyAction !== null} onClick={events.handleTurnOn}>
        {busyAction === 'turn-on' ? 'Turning on…' : 'Turn on'}
      </Button>
    ) : null;

  return (
    <SettingsSection
      id={NOTIFICATIONS_SECTION_ID}
      title="Notifications"
      description={sectionDescription}
    >
      <SettingRow
        title={
          <>
            This device
            <ThisDeviceBadge status={status} />
          </>
        }
        description={statusDescriptions[status]}
        control={thisDeviceControl}
      />
      {status === 'needs-home-screen' ? <HomeScreenSteps /> : null}
      {kindSwitches.map((kindSwitch) => (
        <SettingRow
          key={kindSwitch.switchName}
          title={kindSwitch.title}
          description={kindSwitch.description}
          control={
            <Switch
              isOn={notificationSettings[kindSwitch.switchName]}
              label={kindSwitch.title}
              onToggle={() => events.handleToggleSwitch(kindSwitch.switchName)}
            />
          }
        />
      ))}
      <SettingRow
        title="Quiet outside working hours"
        description={`Nothing arrives outside ${workingHoursStart}–${workingHoursEnd}, except check-ins for work you started then.`}
        control={
          <Switch
            isOn={notificationSettings.quietOutsideWorkingHours}
            label="Quiet outside working hours"
            onToggle={() => events.handleToggleSwitch('quietOutsideWorkingHours')}
          />
        }
      />
      <a
        href={`#${workingHoursSectionId}`}
        className="-mt-3 w-fit text-[13px] font-medium text-primary underline-offset-4 hover:underline"
      >
        Change working hours
      </a>
      <div className="grid gap-2">
        <h3 className="text-sm font-medium text-foreground">Devices</h3>
        {notificationSettings.devices.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            No device gets notifications yet. Turn them on above on each device you use.
          </p>
        ) : (
          <ul className="grid gap-2">
            {notificationSettings.devices.map((pushDevice) => (
              <li
                key={pushDevice.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
              >
                <div className="grid min-w-0 gap-0.5">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                    <span className="truncate">{pushDevice.deviceName}</span>
                    {pushDevice.id === thisDeviceId ? (
                      <Badge tone="primary">This device</Badge>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {describeDeviceReach(pushDevice, currentTime)}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`Remove ${pushDevice.deviceName}`}
                  disabled={busyAction !== null}
                  onClick={() => events.handleRequestRemove(pushDevice.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="flex items-start gap-2 text-[13px] text-muted-foreground">
        <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        Notifications travel through your browser’s push service (Apple, Google, Mozilla or
        Microsoft), encrypted so it can’t read them.
      </p>
      <RemoveDeviceDialog
        deviceName={removeTargetName}
        isSubmitting={busyAction === 'remove'}
        onConfirm={events.handleConfirmRemove}
      />
    </SettingsSection>
  );
};

export default NotificationsSection;
