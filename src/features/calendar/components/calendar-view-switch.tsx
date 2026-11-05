import SegmentedControl from '@/core/components/molecules/segmented-control';
import type { CalendarView } from '@/features/calendar/entities/calendar-address';

const VIEW_OPTIONS = ['Day', 'Week'] as const;

type CalendarViewSwitchProps = {
  selectedView: CalendarView;
  onSelectView: (chosenView: CalendarView) => void;
};

const CalendarViewSwitch = ({ selectedView, onSelectView }: CalendarViewSwitchProps) => (
  <SegmentedControl
    label="Calendar view"
    options={VIEW_OPTIONS}
    selectedOption={selectedView === 'day' ? 'Day' : 'Week'}
    onSelectOption={(chosenOption) => onSelectView(chosenOption === 'Day' ? 'day' : 'week')}
  />
);

export default CalendarViewSwitch;
