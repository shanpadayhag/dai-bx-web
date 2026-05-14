# Tasks — Alarm Enabled Toggle + Repeat Mode

Each task is self-contained and includes its tests unless explicitly marked otherwise. Mark complete with `[x]` as work lands.

## 1. [x] Reshape `alarms.types.ts` — add `enabled`, `repeat`, and `normalizeAlarm`

**File**: `src/app/features/alarms/data-access/alarms.types.ts`

**Implementation**:

- Add `export type AlarmRepeat = 'none' | 'daily';`
- Extend `AlarmSpec` with `enabled: boolean` and `repeat: AlarmRepeat`.
- Add `export const normalizeAlarm(raw: unknown): AlarmSpec | null` that defaults missing `enabled` to `true` and missing `repeat` to `'none'`, validates `firesAt: string`, and returns `null` for unrecognizable input.

**Acceptance**:

- `tsc --noEmit` clean across the whole project (consumers will be updated in later tasks but the type widening alone is non-breaking — existing `AlarmSpec` literals will fail to compile if they don't include the new fields, so all call sites must be updated in this task or this task includes touches).

> Note on green-tree: this task's type change is breaking for every literal that constructs an `AlarmSpec`. To keep the tree compiling, in this same task: scan all `AlarmSpec` literals in `src/` and add `enabled: true, repeat: 'none'` defaults. The `alarm-picker` and scheduler will be properly refactored in tasks 4 and 3, but their literals need at least to compile.

**Requirements**: enabling change for 1.1, 2.1, 3.1, 4.1.

---

## 2. [x] Apply `normalizeAlarm` at the persistence read boundary

**Files**:

- `src/app/features/tasks/data-access/tasks.repository.ts` (or wherever IndexedDB rows are converted to `TaskRow`)
- `src/app/features/tasks/data-access/tasks.state.ts` (if legacy import path constructs alarms)
- New test: `src/app/features/alarms/data-access/alarms.types.spec.ts`

**Implementation**:

- Find every code path that reads task rows from storage and produces `TaskRow.alarm`. Wrap with `normalizeAlarm(row.alarm)`.
- For each path, the legacy `{ firesAt, soundId }` shape should now hydrate as `{ firesAt, soundId, enabled: true, repeat: 'none' }`.

**Tests** (new `alarms.types.spec.ts`):

- `normalizeAlarm({ firesAt: '2026-05-14T09:00:00Z', soundId: null })` → adds defaults.
- `normalizeAlarm({ firesAt: '2026-05-14T09:00:00Z', soundId: null, enabled: false, repeat: 'daily' })` → preserves both.
- `normalizeAlarm({ firesAt: '2026-05-14T09:00:00Z' })` → adds `soundId: null` plus defaults.
- `normalizeAlarm(null)` → `null`.
- `normalizeAlarm({})` → `null` (missing `firesAt`).
- `normalizeAlarm({ firesAt: 'not-a-date' })` is acceptable to return; valid-date parsing is out of scope for the normalizer (the scheduler already handles `Number.isNaN(Date.parse(...))`).

**Acceptance**: `pnpm test` clean. Manual: open an existing task that already had an alarm; confirm it still shows the badge and rings on schedule.

**Requirements**: 4.2.

---

## 3. [x] Rewrite `AlarmsScheduler` to honor `enabled` + `repeat`

**Files**:

- `src/app/features/alarms/data-access/alarms.scheduler.ts`
- New: `src/app/features/alarms/data-access/alarms.scheduler.spec.ts`

**Implementation** (per design.md "AlarmsScheduler changes"):

- Remove `_firedKeys` signal.
- Update `nextDue` to skip alarms with `!alarm.enabled`.
- `fire(entry)` now re-reads the latest alarm via `tasksState.findTask(entry.task.id)` (avoid stale snapshot).
- After firing:
  - If `alarm.repeat === 'daily'`: compute `nextMs` by repeatedly adding `86_400_000` until `nextMs > Date.now()`, then `tasksState.setAlarm(groupId, taskId, { ...alarm, firesAt: ISO(nextMs) })`.
  - Else (`repeat === 'none'`): `tasksState.setAlarm(groupId, taskId, { ...alarm, enabled: false })`.
- Inject `TasksState` if not already injected (it is, for `tasksWithAlarm()`).
- Sound play and `_firing` set are unchanged.

**Tests** (new spec):

- Schedule + jasmine fake clock setup, similar to timers.runner.spec.
- Single one-shot alarm fires → modal shown, `setAlarm` called with `enabled: false`, original `firesAt` preserved.
- Single daily alarm fires → modal shown, `setAlarm` called with `firesAt + 24h`, `enabled: true`.
- Daily alarm whose `firesAt` is 3 days in the past at construction → `setAlarm` called once with `firesAt` advanced by 3 × 24h, modal shown once.
- Disabled alarm → `nextDue` returns null, no setTimeout scheduled, modal never shown.
- `dismiss()` clears `_firing` and stops sound; does not modify the alarm.
- Two alarms, one disabled and one enabled → only the enabled one fires.

**Acceptance**: tests pass; manual verification that a daily alarm rolls forward.

**Requirements**: 1.4, 2.4, 2.5, 2.6, 3.1, 3.2, 5.1, 5.2, 5.3.

---

## 4. [x] Picker UI — enabled toggle + repeat control

**Files**:

- `src/app/features/alarms/ui/alarm-picker/alarm-picker.component.ts`
- `src/app/features/alarms/ui/alarm-picker/alarm-picker.component.html`

**Implementation**:

- Add computeds `currentEnabled` and `currentRepeat` reading from `alarm()` with defaults.
- Add handlers `onEnabledChange(value: boolean)` and `onRepeatChange(value: AlarmRepeat)`. Both emit `alarmChange` with the full updated `AlarmSpec`.
- `onEnabledChange(true)` includes the re-arm logic from design.md (`parseHourMinute` + `nextOccurrenceIso` if `firesAt` is in the past).
- `onTimeChange` and `onSoundChange` must preserve `enabled` and `repeat` (currently they emit only `firesAt` and `soundId` — add the missing fields).
- When creating a new alarm (alarm is null), `onTimeChange` must default `enabled: true, repeat: 'none'`.
- HTML additions: an "Enabled" toggle row and a "Repeat" segmented control (two buttons: One-shot / Daily). Match the existing brutalist styling (`border-2 border-border bg-secondary-background shadow-brutal-sm`).
- The "Enabled" toggle is hidden when no alarm exists (creating mode); it only makes sense for an existing alarm.
- The "Repeat" control is visible always — when creating, it sets the initial repeat for the to-be-created alarm.

**Tests**: no component specs (matches codebase convention). The data-access tests in tasks 2 and 3 cover the behavior.

**Acceptance**: open picker, toggle enabled off/on, change repeat to daily, click Done. Reopen → state persists. Build + lint clean.

**Requirements**: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3.

---

## 5. [x] Badge — muted style when disabled

**Files**:

- `src/app/features/alarms/ui/alarm-badge/alarm-badge.component.ts`

**Implementation**:

- Read `alarm.enabled` via a computed.
- Apply muted Tailwind classes when disabled (`bg-secondary-background/50 text-muted-foreground opacity-60` per design).
- Swap icon name to `bell-off` when disabled.

**Acceptance**: manual — disable an alarm, badge appears muted with `bell-off`.

**Requirements**: 1.5, 3.3.

---

## 6. [x] `WorkspaceState.nextAlarm` — filter by `enabled`

**Files**:

- `src/app/features/workspace/data-access/workspace.state.ts`
- `src/app/features/workspace/data-access/workspace.state.spec.ts`

**Implementation**:

- In `nextAlarm`'s loop, skip entries where `!alarm.enabled`.

**Tests** (extend existing spec):

- Two enabled alarms → returns the soonest.
- One enabled (later) + one disabled (sooner) → returns the enabled (later) one.
- Only-disabled alarms → returns null.

**Acceptance**: tests pass.

**Requirements**: 1.6, 2.6 (NFR-4).

---

## 7. [x] End-to-end verification

**Implementation**:

- `pnpm lint` clean.
- `pnpm build` clean — bundle size should be a near-wash.
- `pnpm test` clean.
- Dev-server smoke test:
  1. Open a task, set a new alarm 1 minute in the future, default One-shot. Confirm Enabled toggle is visible. Click Done.
  2. Wait for the modal. Confirm sound plays. Dismiss.
  3. Reopen picker. Confirm Enabled is now OFF, badge shows `bell-off`, time is preserved.
  4. Toggle Enabled ON. Confirm `firesAt` advances to "tomorrow" same time (since today's time has passed). Dismiss picker.
  5. Set another alarm, this time Daily, 1 minute in the future. Dismiss when fires.
  6. Reopen picker. Confirm Enabled is still ON, Repeat is Daily, `firesAt` is "tomorrow" same time.
  7. Disable a daily alarm via the toggle, confirm status-strip "next alarm" no longer counts it.
  8. Reload page mid-state. Confirm all `enabled` and `repeat` values persist.
  9. Simulate a stale daily alarm: in DevTools, manually set a task's alarm `firesAt` to 3 days ago, repeat='daily'. Reload. Confirm modal fires once and `firesAt` is now in the future (within 24h).

**Acceptance**: all checks pass.

**Requirements**: end-to-end coverage of all stories.

---

## Dependencies

```
1 (types + literal fix)
   ↓
2 (normalize at boundary) ─┐
   ↓                       │
3 (scheduler) ─┐           │
4 (picker)    ─┼─→ 7 (verify)
5 (badge)     ─┤
6 (next-alarm)─┘
```

Tasks 3 / 4 / 5 / 6 are independent of each other after task 2 lands; can be done in any order.

## Out of scope for these tasks

- Snooze action (not in requirements).
- DST-stable rolling (explicitly deferred).
- Weekly / cron recurrence (not in requirements).
- Migration of any existing in-memory `_firedKeys` state — it is purely in-memory, cleared on reload, nothing to migrate.
