import type { Category } from '@/core/category';
import sampleCategories from '@/core/sample-categories';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';

const sampleMoment = (day: number, hour: number, minute = 0) =>
  new Date(2026, 10, day, hour, minute);

const sampleNow = sampleMoment(5, 18, 2);

const finishedEvent = (
  eventId: string,
  title: string,
  category: Category | null,
  startsAt: Date,
  endsAt: Date,
  finishedAt: Date = endsAt,
): CalendarEvent => ({
  id: eventId,
  kind: 'tracked',
  title,
  category,
  startsAt,
  endsAt,
  finishedAt,
  source: { kind: 'task' },
});

const plannedEvent = (
  eventId: string,
  title: string,
  category: Category | null,
  startsAt: Date,
  endsAt: Date,
): CalendarEvent => ({
  id: eventId,
  kind: 'planned',
  title,
  category,
  startsAt,
  endsAt,
  finishedAt: null,
  source: null,
});

const weekEvents: CalendarEvent[] = [
  plannedEvent(
    'template-review',
    'Template review',
    sampleCategories.work,
    sampleMoment(2, 16),
    sampleMoment(2, 17, 30),
  ),
  finishedEvent(
    'chinese-monday',
    'Chinese – daily cards',
    sampleCategories.studies,
    sampleMoment(2, 21),
    sampleMoment(2, 21, 25),
  ),
  finishedEvent(
    'first-migration',
    'Write the first migration',
    sampleCategories.goals,
    sampleMoment(3, 16, 10),
    sampleMoment(3, 17, 5),
  ),
  plannedEvent(
    'gym-tuesday',
    'Gym',
    sampleCategories.personal,
    sampleMoment(3, 16, 45),
    sampleMoment(3, 18),
  ),
  finishedEvent(
    'marketing-site',
    'Design the marketing site',
    sampleCategories.goals,
    sampleMoment(4, 16),
    sampleMoment(4, 18, 40),
  ),
  finishedEvent(
    'teach-shev',
    'Teach shev the new stack',
    sampleCategories.goals,
    sampleMoment(4, 20),
    sampleMoment(4, 20, 50),
    sampleMoment(4, 21, 10),
  ),
  finishedEvent(
    'late-reading',
    'Read the Axum changelog',
    sampleCategories.studies,
    sampleMoment(4, 23, 30),
    sampleMoment(5, 0, 40),
  ),
  finishedEvent(
    'chinese-thursday',
    'Chinese – daily cards',
    sampleCategories.studies,
    sampleMoment(5, 13),
    sampleMoment(5, 13, 20),
  ),
  {
    id: 'v3-changelog',
    kind: 'tracked',
    title: 'Write the v3 changelog',
    category: sampleCategories.goals,
    startsAt: sampleMoment(5, 16, 20),
    endsAt: null,
    finishedAt: null,
    source: { kind: 'task' },
  },
  plannedEvent(
    'gym-thursday',
    'Gym',
    sampleCategories.personal,
    sampleMoment(5, 17),
    sampleMoment(5, 18),
  ),
  {
    id: 'board-release',
    kind: 'tracked',
    title: 'Plan the board release',
    category: sampleCategories.work,
    startsAt: sampleMoment(5, 17, 15),
    endsAt: null,
    finishedAt: null,
    source: { kind: 'card' },
  },
  plannedEvent(
    'afk-review',
    'Review the check-in flow',
    sampleCategories.goals,
    sampleMoment(5, 19),
    sampleMoment(5, 19, 30),
  ),
  plannedEvent('call-bank', 'Call the bank', null, sampleMoment(6, 12), sampleMoment(6, 12, 30)),
  plannedEvent(
    'market-session',
    'Plan the Saturday market session',
    sampleCategories.studies,
    sampleMoment(6, 20),
    sampleMoment(6, 21),
  ),
  plannedEvent(
    'clean-room',
    'Clean room',
    sampleCategories.personal,
    sampleMoment(7, 14),
    sampleMoment(7, 15, 30),
  ),
];

const sampleCalendarSource = {
  findNow: (): Date => sampleNow,
  findCategories: (): Category[] => Object.values(sampleCategories),
  findWeekEvents: (): CalendarEvent[] => weekEvents,
  findWorkingHoursStartMinute: (): number => 16 * 60,
};

export default sampleCalendarSource;
