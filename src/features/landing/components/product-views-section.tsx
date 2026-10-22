import { Check, ChevronRight, GripVertical, Repeat2 } from 'lucide-react';
import { categoryColorStyle, type Category } from '@/core/category';
import sampleCategories from '@/core/sample-categories';
import joinClassNames from '@/core/class-names';
import AccentWords from '@/features/landing/components/accent-words';
import SectionHeading from '@/features/landing/components/section-heading';

const miniTree = [
  { name: 'Move to the new apartment', depth: 0, isDone: false, hasChildren: true },
  { name: 'Pack the kitchen', depth: 1, isDone: true, hasChildren: false },
  { name: 'Book the movers', depth: 1, isDone: false, hasChildren: true },
  { name: 'Compare three quotes', depth: 2, isDone: true, hasChildren: false },
  { name: 'Pay the deposit', depth: 2, isDone: false, hasChildren: false },
  { name: 'Change the address', depth: 1, isDone: false, hasChildren: false },
] as const;

const miniColumns = [
  { name: 'To do', cards: ['Clean room', 'Renew passport'] },
  { name: 'Doing', cards: ['Ship the v3 frontend'] },
  { name: 'Done', cards: ['Pay the bills'] },
] as const;

const miniWeek: Array<{
  day: string;
  blocks: Array<{ top: number; height: number; isTracked: boolean; category: Category }>;
}> = [
  { day: 'M', blocks: [{ top: 18, height: 34, isTracked: true, category: sampleCategories.work }] },
  {
    day: 'T',
    blocks: [
      { top: 8, height: 22, isTracked: true, category: sampleCategories.studies },
      { top: 56, height: 20, isTracked: false, category: sampleCategories.goals },
    ],
  },
  {
    day: 'W',
    blocks: [{ top: 14, height: 52, isTracked: true, category: sampleCategories.goals }],
  },
  {
    day: 'T',
    blocks: [
      { top: 24, height: 30, isTracked: true, category: sampleCategories.work },
      { top: 64, height: 16, isTracked: false, category: sampleCategories.studies },
    ],
  },
  {
    day: 'F',
    blocks: [{ top: 40, height: 26, isTracked: false, category: sampleCategories.work }],
  },
];

const ProductViewsSection = () => (
  <section id="product" className="mx-auto grid max-w-6xl scroll-mt-24 gap-14 px-4 py-24 sm:py-32">
    <SectionHeading
      title={
        <>
          Three views of <AccentWords>the same</AccentWords> work
        </>
      }
      description="Write a task once. Nest it as deep as the job needs, drag it across the board, and see the hours it took on the calendar, without copying anything between apps."
    />
    <div className="grid gap-4 md:grid-cols-6">
      <article className="grid gap-6 rounded-3xl border border-border bg-surface p-6 sm:p-8 md:col-span-4 md:row-span-2">
        <div className="grid gap-2">
          <h3 className="text-xl font-medium tracking-[-0.02em] text-foreground">
            Tasks inside tasks
          </h3>
          <p className="max-w-[48ch] text-[15px] text-muted-foreground">
            Break a job down to the smallest step. Every level folds away, so the list stays as
            short as you need it to be.
          </p>
        </div>
        <div className="grid content-start gap-1 rounded-2xl border border-border bg-background p-3 shadow-soft">
          {miniTree.map((miniTask) => (
            <div
              key={miniTask.name}
              className="flex h-10 items-center gap-2.5 rounded-lg px-2 hover:bg-surface"
              style={{ marginLeft: miniTask.depth * 24 }}
            >
              <GripVertical className="size-3.5 text-border-strong" />
              {miniTask.hasChildren ? (
                <ChevronRight className="size-3.5 rotate-90 text-muted-foreground" />
              ) : (
                <span className="size-3.5" />
              )}
              <span
                className={
                  miniTask.isDone
                    ? 'inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground'
                    : 'size-4 rounded-full border-[1.5px] border-border-strong'
                }
              >
                {miniTask.isDone ? <Check className="size-2.5" strokeWidth={3.5} /> : null}
              </span>
              <span
                className={
                  miniTask.isDone
                    ? 'text-sm text-muted-foreground line-through'
                    : 'text-sm text-foreground'
                }
              >
                {miniTask.name}
              </span>
            </div>
          ))}
        </div>
      </article>
      <article className="grid content-between gap-6 rounded-3xl border border-border bg-surface p-6 md:col-span-2">
        <div className="grid grid-cols-3 gap-2">
          {miniColumns.map((miniColumn) => (
            <div
              key={miniColumn.name}
              className="grid content-start gap-1.5 rounded-xl bg-surface-strong p-1.5"
            >
              <span className="px-1 text-[11px] font-medium text-muted-foreground">
                {miniColumn.name}
              </span>
              {miniColumn.cards.map((miniCard) => (
                <span
                  key={miniCard}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] leading-tight text-foreground shadow-soft"
                >
                  {miniCard}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="grid gap-1.5">
          <h3 className="text-lg font-medium tracking-[-0.02em] text-foreground">
            A board for the big picture
          </h3>
          <p className="text-sm text-muted-foreground">
            Lists, cards and checklists, like the board you already know.
          </p>
        </div>
      </article>
      <article className="grid content-between gap-6 rounded-3xl bg-ink p-6 text-ink-foreground md:col-span-2">
        <div className="grid grid-cols-5 gap-1.5">
          {miniWeek.map((miniDay, miniDayIndex) => (
            <div key={`${miniDay.day}-${miniDayIndex}`} className="grid gap-1.5">
              <span className="text-center text-[11px] text-ink-muted">{miniDay.day}</span>
              <div className="relative h-24 rounded-lg bg-white/5">
                {miniDay.blocks.map((miniBlock) => (
                  <span
                    key={miniBlock.top}
                    className={joinClassNames(
                      'absolute inset-x-1 rounded-md',
                      miniBlock.isTracked ? 'category-swatch' : 'category-soft',
                    )}
                    style={{
                      ...categoryColorStyle(miniBlock.category),
                      top: miniBlock.top,
                      height: miniBlock.height,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-1.5">
          <h3 className="text-lg font-medium tracking-[-0.02em]">A calendar that remembers</h3>
          <p className="text-sm text-ink-muted">
            Each category keeps its color. Solid is what you did, outlined is what you planned.
          </p>
        </div>
      </article>
    </div>
    <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <Repeat2 className="size-4 text-primary" />
      Recurring cards come back to To do on their own, with their checklists reset.
    </p>
  </section>
);

export default ProductViewsSection;
