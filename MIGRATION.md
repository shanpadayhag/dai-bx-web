# MIGRATION — Angular → SolidJS

T19 artifact for DaiBX. This file is short by design — it covers (1) how to run the parity sweep, (2) the parity checklist itself, and (3) the deliberate deviations from the Angular original.

## Running both apps side-by-side

The two apps share the same IndexedDB (`daibx_app` v3), so opening them in the same browser profile shows the same data. They differ only in code.

```bash
# In one terminal — Angular original
cd client-web-old
npm start            # ng serve, default http://localhost:4200/

# In another — SolidJS port
cd client-web
npm run dev          # vite, default http://localhost:5173/
```

Open both URLs in two windows of the same browser. Pre-existing IndexedDB data appears in both.

## Parity checklist

Tick each row as you confirm it. Notes column is for anything the SolidJS port does *differently* — if the difference is intentional and already listed in the deviations section below, write "see deviations". If it's genuinely new behaviour (regression or otherwise), add a one-line description so it can be triaged.

### Groups
- [ ] **Create** — type a name in the "Create a new group…" input + Enter / click `+ New`. New group appears in both apps.
- [ ] **Rename** — double-click the group name, edit, Enter / blur. Rename persists in both apps.
- [ ] **Reorder** — drag a group by the handle (visible on hover). Order persists.
- [ ] **Delete** — Trash2 on the group row. Group + all its tasks gone in both apps.
- [ ] **Hide / show** — eye icon top-right → ManageGroupsModal → toggle a group's checkbox. Hidden group disappears from main view, reappears when unhidden. "X hidden" link in both apps.
- [ ] **Empty state** — delete all groups. "No groups yet. Create one above." renders.

### Tasks
- [ ] **Add** — type in a group's "Add a task…" input + Enter. Task appears.
- [ ] **Complete (top-level)** — click the circle. Strikethrough + grey appearance in both.
- [ ] **Complete (cascade)** — complete a parent task with children. Children get marked complete too.
- [ ] **Uncomplete** — click the circle on a completed task. Reverts.
- [ ] **Delete** — Trash2 on the task row. Task + its subtree removed.
- [ ] **Reorder within a parent** — drag a task by the handle (visible on hover). Order persists.
- [ ] **Expand / collapse** — chevron on a task with subtasks. State persists across reload.
- [ ] **Add subtask** — `+` button on a task row. Inline input appears. Submit adds a child task.
- [ ] **Subtasks at depth 2+** — repeat the above on a subtask. Tree renders correctly.

### Alarms
- [ ] **One-shot fires once** — set an alarm 1 min in the future, leave the app open. AlarmFiringModal pops up. Acknowledge → modal closes, alarm becomes disabled.
- [ ] **Daily repeats** — set an alarm with "Daily" + a time. Fire, dismiss. Verify the alarm's `firesAt` jumps to the next day.
- [ ] **Enable toggle** — uncheck Enabled on an existing alarm. Badge becomes muted bell-off. Re-check → re-enables.
- [ ] **Sound choice** — pick a non-default sound. Trigger fire (set 1 min ahead). Verify the chosen sound plays.
- [ ] **Complete from firing modal** — when AlarmFiringModal is showing, click Done. Task is marked complete AND the alarm is dismissed.
- [ ] **Dismiss only** — click Dismiss instead. Task stays incomplete, alarm goes to disabled (one-shot) or reschedules (daily).
- [ ] **AlarmBadge time** — formatted `HH:MM` matches across both apps.
- [ ] **Status strip "next alarm"** — shows the next upcoming alarm in both apps.

### Timers
- [ ] **Create single-step version** — open TimerEditor on a task, `+ Add timer version`, `+ Add step`, Start.
- [ ] **Multi-step version** — add multiple steps, Start. Each step's elapsed plays the sound, advances (auto or manual).
- [ ] **Auto-advance OFF** — turn off the toggle. Step elapses → status becomes "awaiting advance". User manually advances.
- [ ] **Multiple versions** — add a second version. Switch between via the chips. Each version preserves its own steps + sound + auto-advance.
- [ ] **Concurrent runs** — start a timer on task A, then on task B. TimerRunningBanner cycles between them with prev/next + arrow keys.
- [ ] **Persistence** — start a timer, refresh the page. Timer continues with the correct remaining seconds.
- [ ] **Cancel** — cancel a running timer from the banner. Disappears.
- [ ] **Completion** — last step elapses with auto-advance ON → status `completed`. Banner shows "completed" state until dismissed.

### Sounds
- [ ] **Upload** — `/settings`, pick one or more audio files. Each appears in the list. Non-audio files are silently skipped.
- [ ] **Preview** — play/stop button on a sound row loops the sample.
- [ ] **Set as default** — star toggle. Other sounds' stars clear.
- [ ] **Delete** — Trash2 on a sound row. Removed. If it was default, default unsets.

### Data integrity
- [ ] **Existing data carries over** — open the SolidJS app on a profile that already used the Angular app. All groups, tasks, alarms, timer versions, sounds appear intact.
- [ ] **Active timer survives the cutover** — start a timer in the Angular app, switch to the SolidJS app. The run continues (per design note: same `localStorage` key `daibx_timer_runs`).

## Intentional deviations from the Angular original

Anything visible that the SolidJS port does differently and on purpose. None of these are bugs to report during the sweep.

### Accessibility (T17)

The Angular original ships with WCAG AA contrast failures and skipped heading levels. axe-core had to land at zero serious/critical, so:

- **`--primary-foreground` is black, not white.** Original is white-on-Instrument-Blue at ~2.3:1 contrast, which fails AA. Black-on-Instrument-Blue is ~9.4:1 and reads as more on-brand brutalist. Affects every `bg-primary` button (Start in TimerEditor, `+ New`, Done in AlarmPicker, etc.).
- **`--subtle-foreground` darkened from `oklch(60% 0 0)` to `oklch(45% 0 0)`** — small uppercase labels (FIRES, REPEAT, STEPS, …) were failing 4.5:1. Now match `--muted-foreground`.
- **Group/empty headings: `<h3>` → `<h2>`** — heading-order under the page `<h1>` was skipping h2.
- **Drag handles are `aria-hidden`** instead of carrying `aria-label="Drag to reorder"`. The drag affordance is mouse/touch only; labeling it for screen readers advertised an action they couldn't perform. (Keyboard reorder is a deferred feature, not in this rewrite.)
- **`tap-44` invisible touch-target expansion** on the workspace action cluster — visual size stays 28×28 px, but a `::before { inset: -8px }` widens the click region to 44×44 per WCAG 2.5.5 AAA. Not visible.
- **`prefers-reduced-motion` is a catchall** — Angular only neutralised `.brutal-press`. The SolidJS port neutralises every transition/animation under `*, *::before, *::after`. Users on reduced-motion see no transition durations.

### Behaviour

- **Timer versions start with zero steps and block close until you add one (T16).** The Angular original seeded a version with a 5-minute placeholder step that the user usually had to remember to edit. The SolidJS port encodes the rule in data: a version with `timers.length === 0` blocks Done / Esc / backdrop / Start; user must click `Add step` (or delete the version) to close. Caption "ADD A STEP TO SAVE" + `·` chip marker make it visible. The deferred-edit problem the Angular flow tolerated is now structurally impossible.
- **`Esc` in TimerEditor while blocked shifts focus to "Add step" (T17).** Angular's behaviour was an unannounced no-op. SolidJS moves focus + shows the brand-blue focus ring so keyboard users see what the rule wants.

### Route surface

- **`/import` removed.** The Angular app had an import route used during initial migration work; it's not part of the production surface and is removed in the rewrite.

### Internal architecture (not user-visible)

These don't affect parity but are documented so future readers don't think they're bugs:

- **`pickingTimerTaskId` lives on `WorkspaceContext`** instead of as a local `createSignal(false)` in `TaskItem`. The modal-open state survives the `TaskItem` remounts that store mutations used to trigger. (Pre-T18 only — after T18 those remounts no longer happen, but the lift stays as the right architectural fit for global UI state of this kind.)
- **`tasks/store.ts` mutates via `produce` from `solid-js/store`** (T18) instead of the old "rebuild every Task reference via `.map(t => ({ ...t }))` and `replaceTree`" pattern. Identity for unchanged tasks stays stable. Every store→IDB hop goes through `unwrap(task)` first because Solid's store proxy isn't `structuredClone`-able and the repo's `try/catch` would otherwise swallow the failure silently.
