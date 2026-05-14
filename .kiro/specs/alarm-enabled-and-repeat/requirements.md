# Requirements — Alarm Enabled Toggle + Repeat Mode

## Context

Today an alarm has only `firesAt` and `soundId`. When it fires, the modal shows; user dismisses; the alarm stays attached to the task, but the in-memory `firedKeys` prevents it from firing again. Two real problems:

1. After a one-shot alarm has fired, there is no UX for "I want this same alarm to ring tomorrow morning too" — the user has to delete and recreate.
2. There is no UX for "I want to silence this alarm for now but keep it on the task" — the user has to delete it entirely.

This spec adds two independent controls per alarm:

- **Enabled toggle** — master on/off. Disabled alarms do not ring.
- **Repeat mode** — `none` (default) or `daily`. Daily alarms automatically roll their `firesAt` forward 24 hours after each firing.

## Decisions locked at scoping

- **Default for new alarms**: `enabled = true`, `repeat = 'none'`. (One-shot, on.)
- The two controls are independent: a daily alarm can be disabled; a disabled alarm can be daily.
- A one-shot alarm that has already fired stays attached to the task at its original `firesAt`. The user may toggle `enabled` off and back on; turning it back on re-arms the alarm to the next occurrence of its hour:minute (today if not yet passed, otherwise tomorrow).

## Personas

- **Solo user** — wants daily reminders without recreating them; wants to silence an alarm without losing it.

## User stories

### Story 1 — Toggle alarm on / off without losing it

**As a** user with an alarm attached to a task,
**I want** to disable the alarm without deleting it
**so that** I can re-enable it later without re-entering time and sound.

#### Acceptance criteria

1. When the user opens the alarm picker for a task that has an alarm, the system shall render an "Alarm on/off" toggle reflecting the alarm's `enabled` state.
2. When the user toggles the alarm off, the system shall persist `enabled = false` on the alarm; the alarm shall remain attached to the task with its existing `firesAt`, `soundId`, and `repeat` fields.
3. When the user toggles the alarm on, the system shall persist `enabled = true` and, if `firesAt` is in the past, advance `firesAt` to the next occurrence of its hour:minute (today if not yet passed, otherwise tomorrow).
4. While an alarm has `enabled = false`, the scheduler shall not schedule or fire it.
5. While an alarm has `enabled = false`, the task-row alarm badge shall render in a muted style (distinguishable from an enabled alarm).
6. While an alarm has `enabled = false`, the status-strip "next alarm" widget shall not consider it.

### Story 2 — Make an alarm repeat daily

**As a** user with a daily routine,
**I want** an alarm that automatically re-arms for tomorrow after it fires today
**so that** I don't have to recreate it every day.

#### Acceptance criteria

1. When the user opens the alarm picker, the system shall render a "Repeat" control with two options: "One-shot" (default) and "Daily".
2. When the user changes the repeat to "Daily", the system shall persist `repeat = 'daily'` on the alarm without modifying `firesAt`, `soundId`, or `enabled`.
3. When the user changes the repeat back to "One-shot", the system shall persist `repeat = 'none'` similarly.
4. When a daily alarm fires, the system shall advance its `firesAt` by exactly 24 hours from the previous `firesAt` (keeping hour:minute stable across DST shifts is out of scope — see Non-functional 3).
5. When a daily alarm fires while `enabled = true`, the scheduler shall continue to schedule the next-day firing automatically.
6. When a daily alarm fires while `enabled = false`, the scheduler shall not fire it (Story 1 AC 4 takes precedence).

### Story 3 — A one-shot alarm stays attached after firing

**As a** user who set a one-shot alarm,
**I want** the alarm to remain attached to the task after it fires
**so that** I can re-enable it later for tomorrow without re-entering the time.

#### Acceptance criteria

1. When a one-shot alarm fires, the system shall keep the alarm attached to the task and shall not modify `firesAt`, `repeat`, or `soundId`.
2. When a one-shot alarm fires, the system shall set `enabled = false` automatically (so the user understands at a glance that it is no longer armed).
3. While a one-shot alarm has `enabled = false` and `firesAt` is in the past, the alarm badge shall remain visible on the task row but in the muted style (Story 1 AC 5).
4. When the user toggles such a stale alarm back on, the system shall advance `firesAt` to the next occurrence (Story 1 AC 3).

### Story 4 — Reload preserves the new state

**As a** user who reloads the page,
**I want** alarm `enabled` and `repeat` values to survive
**so that** my configuration is not lost.

#### Acceptance criteria

1. While a task has an alarm, the system shall persist `enabled` and `repeat` along with `firesAt` and `soundId`.
2. When the app loads existing tasks whose alarms predate this feature (only `firesAt` and `soundId`), the system shall treat missing `enabled` as `true` and missing `repeat` as `'none'`.

### Story 5 — In-memory firedKeys is no longer required for one-shot

**As a** developer,
**I want** the alarm scheduler to no longer rely on the in-memory `firedKeys` set for one-shot alarms
**so that** reloading the page does not cause an already-fired one-shot alarm to ring again.

#### Acceptance criteria

1. When a one-shot alarm fires, the system shall mark it `enabled = false` (Story 3 AC 2) so the scheduler will not consider it on subsequent ticks or after reload.
2. When a daily alarm fires, the system shall advance `firesAt` so the scheduler's next-due computation naturally skips past the just-fired instance.
3. The system shall remove the existing `_firedKeys` signal from `AlarmsScheduler`; in-memory dedup is no longer needed.

## Non-functional requirements

1. The alarm picker shall use `ChangeDetectionStrategy.OnPush` and signal-based inputs/outputs.
2. Toggling `enabled` or `repeat` shall update the underlying task in one `WorkspaceState.setTaskAlarm(...)` call (single signal mutation, single persistence write).
3. **DST**: daily rolling adds exactly `24 * 60 * 60 * 1000` ms. Across spring-forward / fall-back boundaries, the displayed hour may shift by an hour. Handling DST-stable hour:minute is out of scope; document this for a future iteration.
4. The status-strip "next alarm" computation shall ignore disabled alarms.

## Out of scope

- Weekly schedules / arbitrary recurrence patterns (only `none` and `daily` for now).
- Per-weekday selection (Mon/Wed/Fri only).
- DST-stable daily roll (hour:minute preserved across DST). Accepted hour-drift across DST boundaries.
- Snooze action on the firing modal.
- A separate "alarms list" or settings page for managing all alarms.
- Pre-fire reminders (e.g. "ring 5 minutes before").
