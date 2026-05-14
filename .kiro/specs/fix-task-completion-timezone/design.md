# Design: local-timezone `todayIso()`

<!-- Status: draft -->

## Approach

Replace the body of `todayIso()` in `src/app/shared/utils/dates.ts` so the `YYYY-MM-DD` string is built from the user's **local** calendar components instead of the UTC instant. The function's signature, return shape, module path, and every call site stay identical. No call-site changes, no migration, no schema change.

Because the bug exists in exactly one function and every reader of `completedDate` / `hiddenUntil` already routes through that function, fixing the function fixes every symptom listed in `bugfix.md`.

## The fix

```ts
// src/app/shared/utils/dates.ts
export const dateToLocalIso = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayIso = (): string => dateToLocalIso(new Date());
```

Two functions instead of one. `todayIso()` keeps its current shape (callers untouched). `dateToLocalIso(date)` is the pure, testable core — it takes a Date and returns the local `YYYY-MM-DD`. Splitting them is what makes the fix unit-testable in a timezone-agnostic way (see Testing below).

### Why `getFullYear` / `getMonth` / `getDate`

These three accessors are defined to read the date in the **local** timezone of the host. They are the textbook way to get the user's wall-clock calendar date in JavaScript. They have zero runtime cost beyond reading three numeric fields off the `Date` object, no `Intl` initialization, and no locale-dependent parsing.

### Alternatives considered

| Approach | Verdict |
|---|---|
| `date.toLocaleDateString('sv-SE')` (Swedish locale happens to format as `YYYY-MM-DD`) | One-liner, but relies on a locale trick a reader has to decode. Also pulls in `Intl` formatting overhead per call. Rejected for readability. |
| `Intl.DateTimeFormat('en-CA').format(date)` | Same locale trick, same overhead. Rejected. |
| Store an explicit `completedAt: Date` timestamp instead of a `YYYY-MM-DD` string | A real change of model. Would require migration of every existing row in IndexedDB and rewrites of every comparison. Out of scope — `bugfix.md` explicitly preserves the storage shape. |
| Tick a midnight timer to mutate the UI exactly when local midnight strikes | Out of scope per the approved bugfix decision ("correct on next render"). Can be added later as a separate feature. |

## What is not changing

- **Storage shape.** `completedDate` and `hiddenUntil` remain `YYYY-MM-DD` strings or `null`. Existing IndexedDB rows are still valid.
- **Comparison semantics.** Every existing `task.completedDate === todayIso()` and `task.hiddenUntil <= todayIso()` keeps working — the strings compare lexicographically, which agrees with chronological order for fixed-width `YYYY-MM-DD`.
- **All four call sites** named in `bugfix.md`:
  - `features/tasks/data-access/tasks.tree.ts:7` (`isVisibleToday`)
  - `features/tasks/data-access/tasks.tree.ts:45` (`toggleTaskCompletionById`)
  - `features/workspace/data-access/workspace.state.ts:67` (`visibleTaskCount`)
  - `features/workspace/ui/task-item/task-item.component.ts:137` (`isCompleted` computed)
- **The `isCompleted` computed in `task-item.component.ts:137`** is a `computed()` over `this.task()`. It re-evaluates whenever `task()` changes — which is what already happens on app open, refresh, or any task mutation. That is sufficient for "correct on next render" and was the approved scope.

## Behavior at the boundaries

| Moment (user-local) | Before fix | After fix |
|---|---|---|
| 14 May 23:59 — task completed | `completedDate = today (local) ✓` (in PHT) or `tomorrow ✗` (in EST) | `completedDate = "2026-05-14" ✓` everywhere |
| 15 May 00:00 — page refreshed | Stale completion lingers up to 8h (PHT) or already cleared early (EST) | Completion clears at the first local-midnight refresh, everywhere |
| 15 May 12:00 — page refreshed | OK by now | OK |

DST transitions: `getDate()` returns the local civil date, which is what the user sees on their wall clock, including across DST shifts. No special handling needed.

## Testing

`src/app/shared/utils/dates.spec.ts` (new file, Jasmine + Karma to match existing test setup).

The test runner's timezone is not under our control, so the tests are written to be timezone-agnostic by constructing dates with explicit local components.

1. **Format shape.** `dateToLocalIso(new Date(2026, 0, 5))` returns `"2026-01-05"` — confirms zero-padding of both month and day.
2. **Year, month, day extraction.** `dateToLocalIso(new Date(2026, 11, 31, 23, 59, 59))` returns `"2026-12-31"` — confirms end-of-year, end-of-day local values.
3. **Local-not-UTC regression.** Construct a `Date` whose UTC date and local date are guaranteed to differ regardless of test-runner timezone, and assert the function returns the local one. Approach: use `new Date(<year>, <month>, <day>, 0, 0, 0)` (always local midnight on that day) — its UTC date will be the day before for any TZ east of UTC. Assert the function returns `<year>-<month>-<day>`, not the UTC slice. *Note: in pure-UTC test runners the UTC and local match by definition; the local-component constructor is still the right contract test because it exercises the local accessors used in the implementation.*
4. **`todayIso()` agrees with the local clock.** Assert `todayIso()` matches `${new Date().getFullYear()}-${pad(new Date().getMonth()+1)}-${pad(new Date().getDate())}`. This locks the function to the local-component definition for the future.

No integration or e2e tests are added — every consumer is read-coverage by the existing UI working correctly after the fix, and a manual repro per `bugfix.md` confirms the user-visible behavior.

## Risk and rollback

- **Risk: very low.** Single-file change, no API change, no schema change.
- **Rollback:** revert the commit. No data fix needed — `completedDate` / `hiddenUntil` strings written under either implementation remain valid `YYYY-MM-DD` strings.
- **One-time transient on rollout:** see `bugfix.md` — for users west of UTC who completed an evening task right before the fix ships, that task may briefly appear reset earlier than expected on the first day post-fix. Self-healing within 24 h. No user action required.
