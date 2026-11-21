import type { PushSupport } from '@/features/notifications/entities/push-support';

export type ThisDeviceStatus = 'on' | 'off' | 'blocked' | 'needs-home-screen' | 'unsupported';

export type ThisDeviceFacts = {
  pushSupport: PushSupport;
  permission: NotificationPermission;
  thisDeviceId: string | null;
};

const thisDeviceStatus = (
  thisDeviceFacts: ThisDeviceFacts,
  listedDeviceIds: readonly string[] | null = null,
): ThisDeviceStatus => {
  if (thisDeviceFacts.pushSupport !== 'supported') return thisDeviceFacts.pushSupport;
  if (thisDeviceFacts.permission === 'denied') return 'blocked';
  const isRegistered =
    thisDeviceFacts.permission === 'granted' &&
    thisDeviceFacts.thisDeviceId !== null &&
    (listedDeviceIds === null || listedDeviceIds.includes(thisDeviceFacts.thisDeviceId));
  return isRegistered ? 'on' : 'off';
};

export default thisDeviceStatus;
