'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

type CalendarScrollAreaProps = {
  initialScrollTop: number;
  children: ReactNode;
};

const CalendarScrollArea = ({ initialScrollTop, children }: CalendarScrollAreaProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollAreaRef.current !== null) scrollAreaRef.current.scrollTop = initialScrollTop;
  }, [initialScrollTop]);

  return (
    <div
      ref={scrollAreaRef}
      className="max-h-[calc(100dvh-11.5rem)] min-h-[420px] overflow-auto overscroll-contain rounded-2xl border border-border bg-background shadow-soft"
    >
      {children}
    </div>
  );
};

export default CalendarScrollArea;
