import { Clock3, History, PencilLine, Timer } from 'lucide-react';
import Badge from '@/core/components/atoms/badge';
import Button from '@/core/components/atoms/button';
import { categoryColorStyle, type Category } from '@/core/category';

const kindLegendItems = [
  { label: 'Planned', swatchClassName: 'border border-foreground/40 bg-foreground/8' },
  { label: 'Tracked from a task', swatchClassName: 'bg-foreground/70' },
  {
    label: 'Tracking now',
    swatchClassName:
      'bg-foreground/70 ring-2 ring-foreground/70 ring-offset-1 ring-offset-background',
  },
  {
    label: 'Away, trimmed off',
    swatchClassName:
      'bg-foreground/70 bg-[repeating-linear-gradient(135deg,var(--background)_0_3px,transparent_3px_6px)]',
  },
] as const;

type CalendarAsideProps = {
  categories: Category[];
};

const CalendarAside = ({ categories }: CalendarAsideProps) => (
  <aside className="grid content-start gap-4">
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
          {kindLegendItems.map((legendItem) => (
            <li
              key={legendItem.label}
              className="flex items-center gap-2.5 text-[13px] text-muted-foreground"
            >
              <span className={`h-3.5 w-5 shrink-0 rounded ${legendItem.swatchClassName}`} />
              {legendItem.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
    <section className="grid gap-4 rounded-2xl border border-border bg-background p-4 shadow-soft">
      <div className="grid gap-1.5">
        <Badge tone="primary" className="justify-self-start">
          <Timer />
          Tracked · edited
        </Badge>
        <h2 className="text-base font-semibold text-foreground">Teach shev the new stack</h2>
        <p className="text-[13px] text-muted-foreground">Wed, Oct 21 · Goals</p>
      </div>
      <dl className="grid gap-2.5 text-[13px]">
        <div className="flex items-center gap-2.5">
          <dt className="sr-only">Time</dt>
          <Clock3 className="size-4 text-muted-foreground" />
          <dd className="font-mono text-foreground tabular-nums">20:00 – 20:50 · 50 min</dd>
        </div>
        <div className="flex items-start gap-2.5">
          <dt className="sr-only">Why it ends there</dt>
          <History className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <dd className="text-muted-foreground">
            Ended at your last check-in. The 21:10 finish was 20 minutes after you stepped away.
          </dd>
        </div>
      </dl>
      <Button variant="secondary" size="sm" className="justify-self-start">
        <PencilLine />
        Change end time
      </Button>
    </section>
  </aside>
);

export default CalendarAside;
