type TimeTrackingSettings = {
  checkInsEnabled: boolean;
  checkInIntervalMinutes: number;
  firstCheckInMinutes: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  trackedCategoryId: string | null;
  calendarTimeZone: string | null;
};

type TimeTrackingChanges = Partial<TimeTrackingSettings>;

export type { TimeTrackingChanges };
export default TimeTrackingSettings;
