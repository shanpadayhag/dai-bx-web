# Tasks — Multiple Concurrent Timers

Each task is self-contained and includes its tests unless explicitly marked otherwise. Mark complete with `[x]` as work lands.

## 1. [x] Reshape `timers.types.ts` — introduce `ActiveRun` and `TimerRunsMap`

**File**: `src/app/features/timers/data-access/timers.types.ts`

**Implementation**:

- Add `ActiveRun` as the three non-idle variants of the current `TimerRun` union.
- Add `TimerRunsMap = Record<string, ActiveRun>`.
- Keep `TimerRun` as `ActiveRun | { status: 'idle' }` for use **only** by the legacy-migration helper inside the runner.
- Add a type guard `isActiveRun(value: unknown): value is ActiveRun` used by storage parsing.

**Acceptance**:

- `tsc --noEmit` is clean.
- No other file is modified yet — the existing union still compiles.

**Requirements**: enabling change for 1.1, 2.1, 6.1.

---

## 2. [x] Add per-run sound helpers to `alarm-sound.ts`

**File**: `src/app/features/alarms/data-access/alarm-sound.ts`

**Implementation**:

- Export `playRunSound(blob: Blob, opts: { loop?: boolean }): { stop: () => void }`.
- Export `playRunBeep(): { stop: () => void }`.
- Both helpers create their own `HTMLAudioElement` / oscillator pair. Neither calls `stopAlarm()`.
- `stop` is idempotent and cleans up the oscillator / pauses the audio / revokes the object URL it created.
- Existing exports (`playBeep`, `playSoundBlob`, `stopAlarm`, `primeAudio`) are unchanged.

**Tests** (`alarm-sound.spec.ts` — create if missing, or extend if present):

- Two `playRunSound` calls produce two independent stop handles; calling one does not stop the other (assert via stubbed `HTMLAudioElement.prototype.pause`).
- `playRunBeep` returns a working stop handle (assert oscillator `stop` is called).

**Acceptance**:

- `pnpm test` passes (or whatever the project runner is — check `package.json`).
- No regressions in alarms feature.

**Requirements**: 2.3.

---

## 3. [x] Refactor `TimersRunner` to multi-run map

**Files**:

- `src/app/features/timers/data-access/timers.runner.ts`
- `src/app/features/timers/data-access/timers.runner.spec.ts`

**Implementation** (per design.md "TimersRunner API" and "Per-run scheduling" sections):

- Replace `_run: signal<TimerRun>` with `_runs: signal<TimerRunsMap>`.
- Expose `runs`, `runningRuns`, `attentionRuns`, `focusedRun` as `computed` signals.
- Expose `runForTask`, `remainingSecondsFor`, `currentStepFor` as pure helpers.
- Update `start(groupId, taskId, timerSetId)` to insert/replace only that task's entry.
- Update `advance(taskId)`, `cancel(taskId)`, `dismiss(taskId)` to operate on the given taskId only. Add `focusNext()` and `focusPrev()`.
- `_focusedTaskId` signal + validity `effect()` that snaps focus to the first attention run when the current focus is gone.
- Scheduling `effect()` diffs `runningRuns` against a `scheduledKeys` map (`taskId -> stepStartedAt`); clears removed/changed timeouts and schedules new ones. Per-run timeouts live in `fireTimeouts: Map<string, ReturnType<typeof setTimeout>>`.
- Singleton 1Hz tick `effect()` driven by `runningRuns().length > 0`.
- `playForRun(taskId, soundId)` uses `playRunSound` / `playRunBeep` and stores the stop handle in `soundHandles: Map<string, () => void>`. `stopSoundFor(taskId)` clears it.
- Stale-cleanup `effect()` (after `tasksState.isLoaded()`): drop entries whose task or timer set is gone — but only that entry.
- `ngOnDestroy`: clear all timeouts, stop all sounds.

**Tests** (rewrite `timers.runner.spec.ts`):

- Two `start` calls on different tasks → both entries present in `runs()`.
- Step-end on task A transitions A only; B remains `running`.
- `runningRuns` sorted by computed end time.
- `attentionRuns` sorted by `finishedAt`.
- `focusedRun` snaps when its taskId leaves the attention list.
- `focusNext` / `focusPrev` wrap around correctly with three entries.
- Cancel on A leaves B untouched.
- Removing the task from `TasksState` for an active run drops only that run.
- Removing the timer set from a task drops only that run.
- Per-run sound: assert `playRunBeep` (or `playRunSound`) called once per step-end, never coupled to other runs.

**Acceptance**:

- Unit tests pass.
- `tsc --noEmit` clean across the project (consumers will be touched in tasks 5–7 but should still compile against the new API — see task 7 for the temporary shim if needed; otherwise consumers in tasks 5–7 must be updated in the same PR to keep the tree green).

> Note on tree-greenness: tasks 5, 6, 7 update consumers to the new API. To keep the working tree compiling between tasks, complete tasks 3 → 5 → 6 → 7 in one branch, even if reviewed task by task. Persistence (task 4) can land before or after the consumer updates without breaking compile.

**Requirements**: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 5.1, 5.2, 7.1, 7.2; NFR-1, NFR-2, NFR-3.

---

## 4. [x] Persistence, migration, replay-elapsed

**Files**:

- `src/app/features/timers/data-access/timers.runner.ts` (storage helpers + boot logic)
- `src/app/features/timers/data-access/timers.runner.spec.ts` (storage tests)

**Implementation**:

- Replace storage key `daibx_timer_run` with new key `daibx_timer_runs`. Envelope: `{ v: 2, runs: TimerRunsMap }`.
- `loadFromStorage()`:
  - Try new key; if envelope parses and `v === 2`, return its `runs` (filtered through `isActiveRun` per entry).
  - Else, try legacy key; if it parses and is a non-idle `TimerRun`, build `{ [taskId]: activeRun }` and `localStorage.removeItem('daibx_timer_run')`.
  - Else, return `{}`.
- `saveToStorage(runs)`:
  - If empty, `localStorage.removeItem('daibx_timer_runs')`.
  - Else, write `{ v: 2, runs }`.
- Persistence `effect()` writes once per reactive tick (default `effect` behavior already coalesces).
- Replay-elapsed: in the scheduling `effect()`, when `delay <= 0`, call `handleStepEnd(taskId)` synchronously instead of `setTimeout`. This handles "reload after step end already passed."

**Tests**:

- Boot with legacy key set to a `running` payload → runs map has one entry, legacy key removed.
- Boot with envelope `v=2` → runs map populated.
- Boot with envelope of an unknown `v` → runs map empty (and bad payload removed, to avoid getting stuck).
- Boot with a `running` entry whose step end is already in the past → run transitions immediately (assert via `runs()[taskId]?.status` after a microtask flush).
- Boot with a `running` entry whose task no longer exists → entry dropped after `tasksState.isLoaded()`.

**Acceptance**:

- Unit tests pass. Manual: clear localStorage, run app, start a timer, reload — timer resumes.

**Requirements**: 6.1, 6.2, 6.3, 6.4, 6.5; NFR-4.

---

## 5. [x] Banner cycler UI

**Files**:

- `src/app/features/timers/feature/timer-running-banner/timer-running-banner.component.ts`
- `src/app/features/timers/feature/timer-running-banner/timer-running-banner.component.html`
- `src/app/features/timers/feature/timer-running-banner/timer-running-banner.component.spec.ts` (create if absent)

**Implementation**:

- Replace `run`, `currentStep`, `remainingSeconds`, `isVisible`, `isRunning`, `isCompleted`, `statusIcon`, `remainingLabel`, `stepBadge`, `taskName` with computeds that derive from `runner.focusedRun()`.
- Visibility: `@if (focused(); as f)` at the template root replaces the existing top-level `@if`.
- New computed: `hasMultiple = computed(() => (focused()?.total ?? 0) > 1)`.
- New computed: `counterLabel = computed(() => focused() ? \`${focused()!.index + 1} / ${focused()!.total}\` : '')`.
- Action handlers receive the focused taskId: `runner.advance(f.taskId)`, `runner.cancel(f.taskId)`, `runner.dismiss(f.taskId)`.
- Prev/next button block — visible only when `hasMultiple()` — calls `runner.focusPrev()` / `runner.focusNext()`. Use `chevron-left` / `chevron-right` icons. Ensure `aria-label="Previous timer"` / `aria-label="Next timer"`.
- Wire keyboard: `ArrowLeft` / `ArrowRight` on the banner element trigger prev/next (host listener).
- Banner is no longer visible for `running` runs (focused list is attention-only) — matches current behavior; no change required.

**Tests** (component spec, signal-friendly):

- Render with zero attention runs → banner not in DOM.
- Render with one `awaitingAdvance` run → banner visible, no prev/next, no counter.
- Render with two attention runs → counter "1 / 2" and prev/next visible.
- Click Next → counter becomes "2 / 2" (or wraps to "1 / 2" depending on starting focus).
- Click Cancel on the focused run with two attention runs → runner.cancel called with the focused taskId.

**Acceptance**: tests pass; banner manually verified with two simulated timers (use the dev server, set step durations to 5 seconds for testing).

**Requirements**: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7.

---

## 6. [x] Status-strip chip — soonest-first + `+N` count

**Files**:

- `src/app/shared/ui/status-strip/status-strip.component.ts`
- `src/app/shared/ui/status-strip/status-strip.component.html`
- `src/app/shared/ui/status-strip/status-strip.component.spec.ts` (create if absent)

**Implementation**:

- Replace `timerRun` and `hasActiveTimer` with `chipRun = computed(() => runner.runningRuns()[0] ?? null)` and `hasActiveTimer = computed(() => chipRun() !== null)`.
- `timerRemaining` / `timerStepBadge` recomputed from `chipRun()` using `runner.remainingSecondsFor(taskId)` and `runner.currentStepFor(taskId)`.
- New computed `extraRunning = computed(() => Math.max(0, runner.runningRuns().length - 1))`.
- Template renders an additional pill `+{{ extraRunning() }}` when `extraRunning() > 0`, inside the existing chip container, after the step badge.

**Tests**:

- No running runs → chip not rendered.
- One running run → chip rendered, no `+N`.
- Three running runs → chip shows the one with shortest remaining; `+2` badge present.

**Acceptance**: tests pass; manual verification with two concurrent timers.

**Requirements**: 4.1, 4.2, 4.3, 4.4.

---

## 7. [x] Task-item indicator switch

**File**: `src/app/features/workspace/ui/task-item/task-item.component.ts`

**Implementation**:

- Replace `isTimerActive` computed:
  ```ts
  protected readonly isTimerActive = computed(() => {
    const r = this.runner.runForTask(this.task().id);
    return r?.status === 'running' || r?.status === 'awaitingAdvance';
  });
  ```
- No template changes required (existing `rowClass` / `dragHandleClass` already key off `isTimerActive`).

**Tests** (extend or create `task-item.component.spec.ts`):

- Two tasks A and B with active running runs → both rows render in active style.
- Cancelling A only → A returns to standard style, B remains active.

**Acceptance**: tests pass.

**Requirements**: 5.1, 5.2.

---

## 8. [x] End-to-end verification + lint + build

**Implementation**:

- `pnpm lint` (or project equivalent) clean.
- `pnpm build` clean — check bundle size has not regressed materially (the runner refactor should be a near-wash; sound helpers add a few hundred bytes).
- `pnpm test` clean.
- Dev server smoke test:
  1. Start app with empty localStorage.
  2. Start a 5-second timer on task A.
  3. Start a 5-second timer on task B before A fires.
  4. Confirm both rows show the active style.
  5. Confirm status-strip chip shows soonest run + `+1` badge.
  6. Let A fire — assert sound plays. Before dismissing, let B fire — assert second sound overlaps with the first.
  7. Banner shows counter "1 / 2". Use prev/next to switch. Click Next on A's banner card → A advances/dismisses, banner focuses B.
  8. Reload page mid-run on a third task C → C resumes counting; A and B prior state is preserved if they were not dismissed.
  9. Delete a task with an active run → its run disappears from banner / chip without affecting other runs.

**Acceptance**: all of the above verified manually. Anything failing is filed as a fix in this branch before declaring the feature done.

**Requirements**: ties the full set of stories together.

---

## Dependencies

```
1 (types) → 2 (sound) → 3 (runner) → 4 (persistence)
                              ↓
                              5 (banner)
                              6 (status strip)
                              7 (task item)
                              ↓
                              8 (verify)
```

Tasks 5, 6, and 7 are independent of each other and can be done in any order after 3. Task 4 can land in parallel with 5–7 (no shared files).

## Out of scope for these tasks

- Updating `DESIGN.md` / `PRODUCT.md` if they reference the single-timer runner — flagged for a follow-up commit if found relevant during task 8.
- Adding a "Stop all timers" action — not in requirements.
- Telemetry / analytics for concurrent-timer usage.
