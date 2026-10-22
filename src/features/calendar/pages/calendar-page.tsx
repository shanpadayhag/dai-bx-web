import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import SegmentedControl from '@/core/components/molecules/segmented-control';
import CalendarAside from '@/features/calendar/components/calendar-aside';
import WeekGrid from '@/features/calendar/components/week-grid';
import sampleCalendarSource from '@/features/calendar/data_sources/sample/calendar-source';

const CalendarPage = () => (
  <div className="grid gap-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h1 className="mr-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          October 19 – 25
        </h1>
        <IconButton label="Previous week">
          <ChevronLeft />
        </IconButton>
        <IconButton label="Next week">
          <ChevronRight />
        </IconButton>
        <Button variant="secondary" size="sm">
          Today
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <SegmentedControl
          label="Calendar view"
          options={['Day', 'Week', 'Month']}
          selectedOption="Week"
        />
        <Button>
          <Plus />
          New event
        </Button>
      </div>
    </header>
    <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
      <WeekGrid
        weekDays={sampleCalendarSource.findWeekDays()}
        weekEvents={sampleCalendarSource.findWeekEvents()}
        hourLabels={sampleCalendarSource.findHourLabels()}
        nowMinute={sampleCalendarSource.findNowMinute()}
      />
      <CalendarAside categories={sampleCalendarSource.findCategories()} />
    </div>
  </div>
);

export default CalendarPage;
