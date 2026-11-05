import backendTimeTrackingSettingsSource from '@/features/tracking/data_sources/backend/time-tracking-settings-source';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';

const findTimeTrackingSettings = (): Promise<TimeTrackingSettings> =>
  backendTimeTrackingSettingsSource.find();

export default findTimeTrackingSettings;
