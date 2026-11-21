import { Share, SquarePlus, Smartphone } from 'lucide-react';

const HOME_SCREEN_STEPS = [
  { icon: Share, text: 'Tap Share in Safari’s toolbar.' },
  { icon: SquarePlus, text: 'Choose Add to Home Screen.' },
  { icon: Smartphone, text: 'Open DaiBX from the new icon, then turn notifications on here.' },
] as const;

const HomeScreenSteps = () => (
  <ol aria-label="Add DaiBX to your Home Screen" className="grid gap-2">
    {HOME_SCREEN_STEPS.map((homeScreenStep, stepIndex) => (
      <li
        key={homeScreenStep.text}
        className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground"
      >
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-background text-xs font-semibold text-muted-foreground tabular-nums shadow-soft">
          {stepIndex + 1}
        </span>
        <homeScreenStep.icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span>{homeScreenStep.text}</span>
      </li>
    ))}
  </ol>
);

export default HomeScreenSteps;
