import Badge from '@/core/components/atoms/badge';
import type { ThisDeviceStatus } from '@/features/notifications/entities/this-device-status';

const statusBadges: Record<
  ThisDeviceStatus,
  { label: string; tone: 'success' | 'neutral' | 'danger' | 'warning' }
> = {
  on: { label: 'On', tone: 'success' },
  off: { label: 'Off', tone: 'neutral' },
  blocked: { label: 'Blocked', tone: 'danger' },
  'needs-home-screen': { label: 'Needs Home Screen', tone: 'warning' },
  unsupported: { label: 'Not supported', tone: 'neutral' },
};

const ThisDeviceBadge = ({ status }: { status: ThisDeviceStatus }) => (
  <Badge tone={statusBadges[status].tone}>{statusBadges[status].label}</Badge>
);

export default ThisDeviceBadge;
