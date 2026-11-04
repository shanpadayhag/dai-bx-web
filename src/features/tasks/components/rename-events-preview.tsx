'use client';

import { useEffect } from 'react';
import RenameEventsDialog from '@/core/components/organisms/rename-events-dialog';

const RENAME_EVENTS_PREVIEW_ID = 'rename-events-preview';

const RenameEventsPreview = () => {
  useEffect(() => {
    document.getElementById(RENAME_EVENTS_PREVIEW_ID)?.showPopover();
  }, []);

  return (
    <RenameEventsDialog
      id={RENAME_EVENTS_PREVIEW_ID}
      eventCount={3}
      previousName="Write the v3 changelog"
      nextName="Write the v3.2 changelog"
    />
  );
};

export default RenameEventsPreview;
