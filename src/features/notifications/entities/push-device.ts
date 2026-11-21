type PushDevice = {
  id: string;
  deviceName: string;
  createdAt: string;
  lastDeliveredAt: string | null;
};

export type NewPushDevice = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  deviceName: string;
  timeZone: string;
};

export const MAX_PUSH_DEVICES = 10;

export default PushDevice;
