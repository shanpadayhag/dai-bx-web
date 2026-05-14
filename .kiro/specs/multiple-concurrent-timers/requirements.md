# Requirements — Multiple Concurrent Timers

## Context

Today the app holds a single `TimerRun` in `TimersRunner._run`. Starting a timer on task B while task A's timer is running silently replaces A's run. That is the bug-shaped limitation this feature removes.

After this change, **every task can carry its own independently-running timer at the same time**, with the existing per-step UX (auto-advance, awaiting-advance, completed, sound on step-end) preserved per-task.

## Decisions locked at scoping

- **Concurrency cap**: one timer per task; many tasks can run timers concurrently. No global ceiling.
- **Banner**: single banner that cycles. Prev / next controls and a "k of N" count when more than one timer is in attention state (`awaitingAdvance` / `completed`).
- **Step-end sound**: each timer plays its own sound when its step ends. Sounds may overlap if step-ends collide.

## Personas

- **Solo user** — runs a few cooking / focus / break timers in parallel from different task rows.

## User stories

### Story 1 — Start a timer without stopping another

**As a** user with a timer already running on task A,
**I want** to start a timer on task B
**so that** both timers run concurrently and neither is silently cancelled.

#### Acceptance criteria

1. When the user starts a timer on a task that has no active run, the system shall create a new running run for that task without modifying runs on other tasks.
2. When the user starts a timer on a task that already has an active run (`running`, `awaitingAdvance`, or `completed`), the system shall replace only that task's run with the new running run; runs on other tasks shall remain unchanged.
3. If the chosen timer set has zero timers, then the system shall not create or replace any run.

### Story 2 — Each timer ticks and fires independently

**As a** user with timers running on multiple tasks,
**I want** each timer to count down and fire on its own schedule
**so that** finishing one timer does not affect the others.

#### Acceptance criteria

1. While more than one timer is in `running` state, the system shall compute each run's remaining seconds against that run's own `stepStartedAt` and step duration.
2. When a step ends for a given run, the system shall transition only that run (to the next step if `autoAdvance`, to `awaitingAdvance` if not, or to `completed` if it was the last step) and shall not modify any other run.
3. When a step ends, the system shall play that run's own step-end sound (set sound, falling back to the user's default sound, falling back to the built-in beep). Sounds from different runs that fire close together shall be allowed to overlap.

### Story 3 — Banner cycles through timers needing attention

**As a** user with several timers that have reached `awaitingAdvance` or `completed`,
**I want** to step through each one and advance or dismiss it
**so that** I can resolve them one at a time without losing track.

#### Acceptance criteria

1. When at least one run is in `awaitingAdvance` or `completed`, the system shall show the running-timer banner.
2. While the banner is visible, the system shall display exactly one run at a time and shall show a "k of N" indicator when N ≥ 2 attention-state runs exist.
3. When N ≥ 2, the system shall render prev and next controls that move the focused run within the attention-state list and shall wrap around at both ends.
4. When the focused run is in `awaitingAdvance` and the user clicks Next, the system shall advance that run and keep focus on the next attention-state run in the list (or hide the banner if none remain).
5. When the focused run is in `completed` and the user clicks Done, the system shall clear that run and keep focus on the next attention-state run in the list (or hide the banner if none remain).
6. When the focused run is in `running` and the user clicks Cancel, the system shall clear only that run.
7. If the focused run is removed by any path (advance, dismiss, cancel, external task deletion), then the banner shall focus the next attention-state run if any exists, otherwise hide.

### Story 4 — Status strip reflects concurrent runs

**As a** user glancing at the top bar,
**I want** to see that timers are active and how many
**so that** I know my multi-task state at a glance.

#### Acceptance criteria

1. When at least one run is in `running` state, the system shall render the status-strip timer chip.
2. The chip shall display the remaining time and step badge of the soonest-to-fire `running` run.
3. When more than one run is in `running` state, the chip shall additionally display a "+N" count of the other running runs.
4. While no run is in `running` state, the system shall hide the status-strip timer chip.

### Story 5 — Per-row indicator stays correct

**As a** user looking at the task list,
**I want** each task row to highlight only when its own timer is the active one
**so that** I can see which tasks have a running timer.

#### Acceptance criteria

1. When a task has its own run in `running` or `awaitingAdvance` state, the system shall render that task row in the active style (left bar + soft background).
2. When a task has no run, or only a `completed` or cleared run, the system shall render it in the standard style.

### Story 6 — Runs survive reload

**As a** user who reloads the page,
**I want** my running timers to resume from where they were
**so that** I do not lose timer state.

#### Acceptance criteria

1. While any task has an active run, the system shall persist the full collection of active runs to local storage.
2. When the app boots and a persisted collection exists, the system shall restore all runs.
3. When the app boots and any restored run's task or timer set no longer exists in `TasksState`, the system shall drop that run from the collection while keeping the others.
4. If a `running` run is restored after the persisted step end time, then the system shall transition it as if the step end fired now (auto-advance, awaitingAdvance, or completed — same logic as a live step end).
5. When the app boots and only a legacy single-run payload (`daibx_timer_run`) exists, the system shall import it into the new collection and remove the legacy key.

### Story 7 — Task deletion / timer-set deletion cleans up

**As a** user who deletes a task or its timer set,
**I want** any active run for that task / set to be cleared
**so that** stale runs do not haunt the UI.

#### Acceptance criteria

1. While any run references a task that no longer exists in `TasksState`, the system shall remove that run within one reactive tick.
2. While any run references a timer set that no longer exists on its task, the system shall remove that run within one reactive tick.

## Non-functional requirements

1. The runner shall not start a new `setInterval` per active run. A single 1-second tick shall update a shared `_now` signal used by all `remainingSeconds` computations.
2. The runner shall schedule one `setTimeout` per `running` run for its own step end, cleared when the run transitions or is removed.
3. The status-strip timer chip and banner shall continue to use `ChangeDetectionStrategy.OnPush` and signal-driven state.
4. Persistence writes shall be debounced or coalesced so that simultaneous transitions do not cause more than one `localStorage.setItem` per reactive tick.

## Out of scope

- Showing more than one running timer simultaneously in the banner (the user picked the cycler shape).
- Global limit on active timer count.
- Notifications outside the app tab (push, system, OS).
- Timer history / log of completed runs.
- Reordering or pinning runs in the banner — the order is fixed by start time.
