import CalendarDay from '@/features/calendar/entities/calendar-day';
import CalendarEvent from '@/features/calendar/entities/calendar-event';

const weekDays: CalendarDay[] = [
  { weekdayLabel: 'Mon', dateLabel: '19', isToday: false },
  { weekdayLabel: 'Tue', dateLabel: '20', isToday: false },
  { weekdayLabel: 'Wed', dateLabel: '21', isToday: false },
  { weekdayLabel: 'Thu', dateLabel: '22', isToday: true },
  { weekdayLabel: 'Fri', dateLabel: '23', isToday: false },
  { weekdayLabel: 'Sat', dateLabel: '24', isToday: false },
  { weekdayLabel: 'Sun', dateLabel: '25', isToday: false },
];

const firstHour = 12;
const hourCount = 14;

const minuteOfDay = (hour: number, minute = 0): number => (hour - firstHour) * 60 + minute;

const weekEvents: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Template review',
    dayIndex: 0,
    startMinute: minuteOfDay(16),
    durationMinutes: 90,
    awayFromMinute: null,
    kind: 'planned',
    timeLabel: '16:00 – 17:30',
  },
  {
    id: 'e2',
    title: 'Chinese – daily cards',
    dayIndex: 0,
    startMinute: minuteOfDay(21),
    durationMinutes: 25,
    awayFromMinute: null,
    kind: 'tracked',
    timeLabel: '21:00 – 21:25',
  },
  {
    id: 'e3',
    title: 'Write the first migration',
    dayIndex: 1,
    startMinute: minuteOfDay(16, 10),
    durationMinutes: 55,
    awayFromMinute: null,
    kind: 'tracked',
    timeLabel: '16:10 – 17:05',
  },
  {
    id: 'e4',
    title: 'Gym',
    dayIndex: 1,
    startMinute: minuteOfDay(19),
    durationMinutes: 60,
    awayFromMinute: null,
    kind: 'planned',
    timeLabel: '19:00 – 20:00',
  },
  {
    id: 'e5',
    title: 'Design the marketing site',
    dayIndex: 2,
    startMinute: minuteOfDay(16),
    durationMinutes: 160,
    awayFromMinute: null,
    kind: 'tracked',
    timeLabel: '16:00 – 18:40',
  },
  {
    id: 'e6',
    title: 'Teach shev the new stack',
    dayIndex: 2,
    startMinute: minuteOfDay(20),
    durationMinutes: 70,
    awayFromMinute: minuteOfDay(20, 50),
    kind: 'trimmed',
    timeLabel: '20:00 – 20:50 · away until 21:10',
  },
  {
    id: 'e7',
    title: 'Chinese – daily cards',
    dayIndex: 3,
    startMinute: minuteOfDay(13),
    durationMinutes: 20,
    awayFromMinute: null,
    kind: 'tracked',
    timeLabel: '13:00 – 13:20',
  },
  {
    id: 'e8',
    title: 'Write the v3 changelog',
    dayIndex: 3,
    startMinute: minuteOfDay(16, 20),
    durationMinutes: 102,
    awayFromMinute: null,
    kind: 'running',
    timeLabel: '16:20 – now',
  },
  {
    id: 'e9',
    title: 'Review the AFK check-in flow',
    dayIndex: 3,
    startMinute: minuteOfDay(19),
    durationMinutes: 30,
    awayFromMinute: null,
    kind: 'planned',
    timeLabel: '19:00 – 19:30',
  },
  {
    id: 'e10',
    title: 'Plan the Saturday market session',
    dayIndex: 4,
    startMinute: minuteOfDay(20),
    durationMinutes: 60,
    awayFromMinute: null,
    kind: 'planned',
    timeLabel: '20:00 – 21:00',
  },
  {
    id: 'e11',
    title: 'Clean room',
    dayIndex: 5,
    startMinute: minuteOfDay(14),
    durationMinutes: 90,
    awayFromMinute: null,
    kind: 'planned',
    timeLabel: '14:00 – 15:30 · weekly',
  },
];

const sampleCalendarSource = {
  findWeekDays: (): CalendarDay[] => weekDays,
  findWeekEvents: (): CalendarEvent[] => weekEvents,
  findHourLabels: (): string[] =>
    Array.from(
      { length: hourCount },
      (_, hourOffset) => `${String((firstHour + hourOffset) % 24).padStart(2, '0')}:00`,
    ),
  findNowMinute: (): number => minuteOfDay(18, 2),
};

export default sampleCalendarSource;
