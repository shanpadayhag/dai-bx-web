import { BellRing, CalendarCheck2, Clock3, Play } from 'lucide-react';
import type { ReactNode } from 'react';
import AccentWords from '@/features/landing/components/accent-words';
import SectionHeading from '@/features/landing/components/section-heading';

type TrackingMomentProps = {
  time: string;
  icon: ReactNode;
  title: string;
  description: string;
};

const TrackingMoment = ({ time, icon, title, description }: TrackingMomentProps) => (
  <li className="grid grid-cols-[52px_36px_1fr] gap-3">
    <span className="pt-2 font-mono text-[13px] text-muted-foreground tabular-nums">{time}</span>
    <span className="inline-flex size-9 items-center justify-center rounded-xl border border-border bg-background text-primary shadow-soft [&_svg]:size-4">
      {icon}
    </span>
    <span className="grid gap-1 pt-1">
      <span className="text-[15px] font-medium text-foreground">{title}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </span>
  </li>
);

const TimeTrackingSection = () => (
  <section
    id="time-tracking"
    className="scroll-mt-24 overflow-hidden border-y border-border bg-surface"
  >
    <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-24 sm:py-32 lg:grid-cols-2">
      <div className="grid gap-10">
        <SectionHeading
          align="start"
          title={
            <>
              Your timer <AccentWords>is</AccentWords> your calendar
            </>
          }
          description="No separate time tracker to remember. The start and finish buttons on a task are the whole interface."
        />
        <ol className="grid gap-6">
          <TrackingMoment
            time="16:20"
            icon={<Play className="fill-current" />}
            title="Press start"
            description="An event opens on your calendar, named after the task."
          />
          <TrackingMoment
            time="17:20"
            icon={<BellRing />}
            title="Answer a check-in"
            description="Once a task runs past its estimate, a notification asks if you’re still on it."
          />
          <TrackingMoment
            time="18:02"
            icon={<CalendarCheck2 />}
            title="Press finish"
            description="The event closes. If you missed a check-in, it suggests your last confirmed time instead."
          />
        </ol>
      </div>
      <div className="relative grid gap-4">
        <div
          aria-hidden="true"
          className="absolute -inset-10 -z-0 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--glow)_30%,transparent),transparent_65%)] blur-2xl"
        />
        <div className="relative ml-auto grid w-full max-w-[380px] gap-3 rounded-2xl border border-border bg-background p-4 shadow-lift">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <BellRing className="size-4" />
            </span>
            <div className="grid gap-0.5">
              <p className="text-sm font-medium text-foreground">
                Still on “Write the v3 changelog”?
              </p>
              <p className="text-[13px] text-muted-foreground">It’s past its 45 min estimate.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <span className="inline-flex h-8 items-center rounded-lg border border-border-strong px-3 text-[13px] font-medium text-foreground">
              I stepped away
            </span>
            <span className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground">
              Still on it
            </span>
          </div>
        </div>
        <div className="relative grid w-full max-w-[440px] gap-3 rounded-2xl border border-border bg-background p-5 shadow-lift">
          <p className="text-xs text-muted-foreground">Finishing</p>
          <p className="text-base font-semibold text-foreground">Write the v3 changelog</p>
          {[
            { title: 'Your last check-in · 17:20', detail: 'Suggested', isSelected: true },
            { title: 'Now · 18:02', detail: 'Worked the whole time', isSelected: false },
          ].map((endOption) => (
            <div
              key={endOption.title}
              className={
                endOption.isSelected
                  ? 'flex items-center gap-3 rounded-xl border border-primary bg-primary-soft/60 p-3'
                  : 'flex items-center gap-3 rounded-xl border border-border p-3'
              }
            >
              <Clock3
                className={
                  endOption.isSelected ? 'size-4 text-primary' : 'size-4 text-muted-foreground'
                }
              />
              <span className="grid flex-1">
                <span className="font-mono text-[13px] font-medium text-foreground tabular-nums">
                  {endOption.title}
                </span>
                <span className="text-xs text-muted-foreground">{endOption.detail}</span>
              </span>
              <span
                className={
                  endOption.isSelected
                    ? 'size-4 rounded-full border-[5px] border-primary'
                    : 'size-4 rounded-full border-[1.5px] border-border-strong'
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default TimeTrackingSection;
