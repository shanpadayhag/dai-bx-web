import ActivityEntry from '@/features/today/entities/activity-entry';
import AgendaItem from '@/features/today/entities/agenda-item';
import UpNextTask from '@/features/today/entities/up-next-task';

const agendaItems: AgendaItem[] = [
  { id: 'a1', timeLabel: '13:00', title: 'Chinese – daily cards · 20m', kind: 'tracked' },
  { id: 'a2', timeLabel: '16:20', title: 'Write the v3 changelog', kind: 'running' },
  { id: 'a3', timeLabel: '19:00', title: 'Review the AFK check-in flow', kind: 'planned' },
  { id: 'a4', timeLabel: '22:30', title: 'Design the calendar week view', kind: 'planned' },
];

const upNextTasks: UpNextTask[] = [
  { id: 'u1', name: 'Review the AFK check-in flow', groupName: 'DaiBX', estimate: '30m' },
  { id: 'u2', name: 'Design the calendar week view', groupName: 'DaiBX', estimate: '2h' },
  { id: 'u3', name: 'Create the Supabase project', groupName: 'DaiBX', estimate: '20m' },
  { id: 'u4', name: 'Prepare the shift notes', groupName: 'Work', estimate: null },
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
