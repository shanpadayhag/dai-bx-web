import ActivityEntry from '@/features/today/entities/activity-entry';
import AgendaItem from '@/features/today/entities/agenda-item';
import UpNextTask from '@/features/today/entities/up-next-task';
import sampleCategories from '@/core/sample-categories';

const agendaItems: AgendaItem[] = [
  {
    id: 'a1',
    timeLabel: '13:00',
    title: 'Chinese – daily cards · 20m',
    kind: 'tracked',
    category: sampleCategories.studies,
  },
  {
    id: 'a2',
    timeLabel: '16:20',
    title: 'Write the v3 changelog',
    kind: 'running',
    category: sampleCategories.goals,
  },
  {
    id: 'a3',
    timeLabel: '19:00',
    title: 'Review the AFK check-in flow',
    kind: 'planned',
    category: sampleCategories.goals,
  },
  {
    id: 'a4',
    timeLabel: '22:30',
    title: 'Gym',
    kind: 'planned',
    category: sampleCategories.personal,
  },
];

const upNextTasks: UpNextTask[] = [
  {
    id: 'u1',
    name: 'Review the AFK check-in flow',
    groupName: 'DaiBX',
    category: sampleCategories.goals,
    estimate: '30m',
  },
  {
    id: 'u2',
    name: 'Chinese – review 20 cards',
    groupName: 'Chinese',
    category: sampleCategories.studies,
    estimate: '2h',
  },
  {
    id: 'u3',
    name: 'Create the Supabase project',
    groupName: 'DaiBX',
    category: sampleCategories.goals,
    estimate: '20m',
  },
  {
    id: 'u4',
    name: 'Prepare the shift notes',
    groupName: 'Shift',
    category: sampleCategories.work,
    estimate: null,
  },
];

const activityEntries: ActivityEntry[] = [
  { id: 'l1', timeLabel: '17:20', summary: 'You checked in', detail: 'Write the v3 changelog' },
  {
    id: 'l2',
    timeLabel: '16:20',
    summary: 'Started a task',
    detail: 'Write the v3 changelog · event created',
  },
  { id: 'l3', timeLabel: '16:18', summary: 'Finished a subtask', detail: 'Add the past releases' },
  {
    id: 'l4',
    timeLabel: '13:20',
    summary: 'Finished a task',
    detail: 'Chinese – daily cards · 20m tracked',
  },
];

const sampleTodaySource = {
  findAgenda: (): AgendaItem[] => agendaItems,
  findUpNext: (): UpNextTask[] => upNextTasks,
  findActivity: (): ActivityEntry[] => activityEntries,
};

export default sampleTodaySource;
