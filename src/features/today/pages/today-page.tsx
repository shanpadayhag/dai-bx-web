import ActivityFeed from '@/features/today/components/activity-feed';
import RunningTaskCard from '@/features/today/components/running-task-card';
import TodayAgenda from '@/features/today/components/today-agenda';
import UpNextList from '@/features/today/components/up-next-list';
import sampleTodaySource from '@/features/today/data_sources/sample/today-source';
import CheckInCard from '@/features/tracking/components/check-in-card';
import sampleTaskSessionSource from '@/features/tracking/data_sources/sample/task-session-source';

const TodayPage = () => {
  const runningTaskSession = sampleTaskSessionSource.findRunning();

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <header className="grid gap-1">
        <p className="text-sm text-muted-foreground">Thursday, October 22</p>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
          Good afternoon, Shan
        </h1>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          <RunningTaskCard taskSession={runningTaskSession} />
          <UpNextList upNextTasks={sampleTodaySource.findUpNext()} />
        </div>
        <div className="grid content-start gap-6">
          <CheckInCard taskSession={runningTaskSession} />
          <TodayAgenda agendaItems={sampleTodaySource.findAgenda()} />
          <ActivityFeed activityEntries={sampleTodaySource.findActivity()} />
        </div>
      </div>
    </div>
  );
};

export default TodayPage;
