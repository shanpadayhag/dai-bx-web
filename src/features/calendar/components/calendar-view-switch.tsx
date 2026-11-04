'use client';

import { useRouter } from 'next/navigation';
import SegmentedControl from '@/core/components/molecules/segmented-control';

const VIEW_OPTIONS = ['Day', 'Week'] as const;

type CalendarViewSwitchProps = {
  selectedView: 'day' | 'week';
};

const CalendarViewSwitch = ({ selectedView }: CalendarViewSwitchProps) => {
  const router = useRouter();

  return (
    <SegmentedControl
      label="Calendar view"
      options={VIEW_OPTIONS}
      selectedOption={selectedView === 'day' ? 'Day' : 'Week'}
      onSelectOption={(chosenOption) =>
        router.push(`/calendar?view=${chosenOption.toLowerCase()}`, { scroll: false })
      }
    />
  );
};

export default CalendarViewSwitch;
