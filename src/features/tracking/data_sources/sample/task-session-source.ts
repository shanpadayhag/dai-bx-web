import TaskSession from '@/features/tracking/entities/task-session';

const runningTaskSession: TaskSession = {
  id: 'session-1',
  taskName: 'Write the v3 changelog',
  groupName: 'DaiBX',
  startedAt: '16:20',
  elapsed: '1:42:08',
  estimate: '45 min',
  lastCheckInAt: '17:20',
  missedCheckInAt: '17:50',
  currentTime: '18:02',
};

const sampleTaskSessionSource = {
  findRunning: (): TaskSession => runningTaskSession,
};

export default sampleTaskSessionSource;
