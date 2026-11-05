type CalendarRange = {
  from: Date;
  to: Date;
};

const DAYS_PER_WEEK = 7;

const localDayAfter = (moment: Date, dayCount: number): Date =>
  new Date(moment.getFullYear(), moment.getMonth(), moment.getDate() + dayCount);

const dayRange = (moment: Date): CalendarRange => ({
  from: localDayAfter(moment, 0),
  to: localDayAfter(moment, 1),
});

const weekRange = (moment: Date): CalendarRange => {
  const daysSinceMonday = (moment.getDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK;
  return {
    from: localDayAfter(moment, -daysSinceMonday),
    to: localDayAfter(moment, DAYS_PER_WEEK - daysSinceMonday),
  };
};

export { dayRange, weekRange };
export default CalendarRange;
