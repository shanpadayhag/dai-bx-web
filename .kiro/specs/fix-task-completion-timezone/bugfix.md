# Bugfix: completed tasks do not reset at local midnight

<!-- Status: draft -->

## Summary

Tasks marked "done" are supposed to reset (become incomplete again) at midnight local time. They do not. After midnight, completed tasks continue to render as completed for several hours — until UTC midnight rolls over. Any user not in the UTC timezone is affected. The size of the offset matches the user's UTC offset (e.g., 8 hours late in PHT, 5 hours early in EST).

Severity: high. The daily reset is the core mechanic of the product — when it fails, the app appears broken for every non-UTC user every single day.

## Current behavior

`completedDate` on a task is set to `todayIso()` when the task is toggled complete. The UI shows the task as "done" when `task.completedDate === todayIso()`. The implementation of `todayIso()` is:

```ts
// src/app/shared/utils/dates.ts:1
export const todayIso = (): string => new Date().toISOString().slice(0, 10);
```

`toISOString()` always emits the UTC date. So for a user in PHT (UTC+8):

1. At 22:00 local on May 14, user marks a task complete. `todayIso()` = `"2026-05-14"` (UTC is 14:00). `completedDate` is saved as `"2026-05-14"`.
2. At 00:00 local on May 15 (UTC is 16:00 still on May 14), the user expects the task to reset. `todayIso()` still returns `"2026-05-14"`. `isCompleted` = `true`. Task remains visually completed.
3. At 08:00 local on May 15 (UTC reaches 00:00 May 15), `todayIso()` finally rolls to `"2026-05-15"`. `isCompleted` becomes `false`. Task resets — 8 hours late.

For a user west of UTC the symptom inverts: the date rolls over *before* local midnight, so a task completed at 18:00 local in EST (UTC-5) is saved with tomorrow's date, then appears reset 1 minute later when checked.

Reproducible:

1. Set system timezone to `Asia/Manila` (UTC+8).
2. Open the app, mark any task done.
3. Set system clock to 00:05 the next day.
4. Refresh. The task still shows as completed. Expected: it should be incomplete.

Same affected codepaths:

- `src/app/features/tasks/data-access/tasks.tree.ts:7` — `isVisibleToday` compares `task.hiddenUntil` against `todayIso()`. "Hide until tomorrow" suffers the same shift.
- `src/app/features/tasks/data-access/tasks.tree.ts:45` — `toggleTaskCompletionById` writes `today = todayIso()` as the completion stamp.
- `src/app/features/workspace/data-access/workspace.state.ts:67` — `visibleTaskCount` filters by `hiddenUntil <= today`.
- `src/app/features/workspace/ui/task-item/task-item.component.ts:137` — `isCompleted` computed.

## Expected behavior

`todayIso()` returns the calendar date in the user's **local** timezone, in `YYYY-MM-DD` format. As soon as the local clock crosses midnight, the function returns the new date — without waiting for UTC to catch up.

Consequence: a task with `completedDate = "2026-05-14"` ceases to be "completed today" at exactly the user's local midnight on the 15th, in line with the user's intuition that "midnight" means *their* midnight.

This is filling a previously-undocumented requirement. After this fix the requirement should be: *When the user's local clock crosses midnight, the system shall treat all previously-completed tasks as incomplete in the UI on the next render.*

## Behavior that must not change

- Tasks completed and checked within the same local calendar day continue to render as completed.
- Toggling a task off (un-completing it) within the same day continues to clear `completedDate` to `null`.
- "Hide until <date>" continues to hide tasks whose `hiddenUntil` is strictly in the future and reveal them on or after that local date.
- The `YYYY-MM-DD` shape of `completedDate` and `hiddenUntil` does not change — existing rows in IndexedDB remain valid strings of the same width.
- All existing comparisons of `completedDate` / `hiddenUntil` against `todayIso()` continue to work without per-call-site changes (the fix is local to `dates.ts`).

## Root cause analysis

Single root cause: `todayIso()` is implemented in terms of UTC, but every caller treats its return value as the user's local "today."

`new Date().toISOString()` is defined to format the instant in UTC. For any non-UTC user, the date portion of the UTC string diverges from the local calendar date for the window equal to the UTC offset around midnight. Because the same function is used both to *write* `completedDate` (at toggle time) and to *read* "is this still today" (on render), the two values stay aligned with each other but neither is aligned with the user's wall clock — producing a reset that lags or leads local midnight by exactly the UTC offset.

Two storage values written under the old UTC-based behavior may exist on a user's device at the moment we ship the fix (e.g., a task completed last night at 22:00 PHT has `completedDate = "2026-05-14"`, which is still the correct local date in their case). For users west of UTC, evening-completed tasks may have been stamped with tomorrow's date and will appear reset slightly earlier than expected for one day after the fix ships. This is a one-time, self-healing transient — no migration is needed.
