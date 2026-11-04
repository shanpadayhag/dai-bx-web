import { Layers } from 'lucide-react';
import { categoryColorStyle, type Category } from '@/core/category';
import EventDetailPanel from '@/features/calendar/components/event-detail-panel';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';

const shapeLegendItems = [
  { label: 'Planned', swatchClassName: 'border border-foreground/40 bg-foreground/8' },
  { label: 'Tracked', swatchClassName: 'bg-foreground/70' },
  {
    label: 'Tracking now',
    swatchClassName:
      'bg-foreground/70 ring-2 ring-foreground/70 ring-offset-1 ring-offset-background',
  },
  {
    label: 'Away, trimmed off',
    swatchClassName:
      'border border-dashed border-foreground/40 bg-[repeating-linear-gradient(135deg,var(--muted-foreground)_0_1.5px,transparent_1.5px_5px)]',
  },
] as const;

type CalendarAsideProps = {
  categories: readonly Category[];
  selectedEvent: CalendarEvent | null;
  now: Date;
};

const CalendarAside = ({ categories, selectedEvent, now }: CalendarAsideProps) => (
  <aside className="grid content-start gap-4">
    {selectedEvent === null ? (
      <p className="rounded-2xl border border-dashed border-border-strong p-4 text-[13px] text-muted-foreground">
        Pick an event to see its details.
      </p>
    ) : (
      <EventDetailPanel
        key={selectedEvent.id}
        calendarEvent={selectedEvent}
        categories={categories}
        now={now}
      />
    )}
    <section className="grid gap-4 rounded-2xl border border-border bg-background p-4 shadow-soft">
      <div className="grid gap-2.5">
        <h2 className="text-[13px] font-semibold text-foreground">Categories</h2>
        <ul className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center gap-2 text-[13px] text-muted-foreground"
            >
              <span
                style={categoryColorStyle(category)}
                className="category-swatch size-3 rounded-full"
              />
              {category.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-2.5 border-t border-border pt-4">
        <h2 className="text-[13px] font-semibold text-foreground">Shapes</h2>
        <ul className="grid gap-2.5">
          {shapeLegendItems.map((legendItem) => (
            <li
              key={legendItem.label}
              className="flex items-center gap-2.5 text-[13px] text-muted-foreground"
            >
              <span className={`h-3.5 w-5 shrink-0 rounded ${legendItem.swatchClassName}`} />
              {legendItem.label}
            </li>
          ))}
          <li className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
            <span className="inline-flex h-3.5 w-5 shrink-0 items-center justify-center rounded border border-border-strong bg-background">
              <Layers className="size-2.5" />
            </span>
            Three or more at once
          </li>
        </ul>
      </div>
    </section>
  </aside>
);

export default CalendarAside;
